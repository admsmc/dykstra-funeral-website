# Manual Testing Tasks

This document tracks manual testing tasks that need to be completed by the user.

## Phase 4, Sub-Phase 4: Real Integrations - Testing Tasks

### Prerequisites

Before running these tests, ensure the following environment variables are configured in `.env`:

**Stripe:**
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**AWS S3:**
```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

---

### 4.1.8 Test Stripe Integration

**Goal:** Verify end-to-end Stripe payment flow with test cards and webhook delivery.

**Steps:**

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Payment with Success Card**
   - Navigate to a case payments page: `http://localhost:3000/portal/cases/[case-id]/payments`
   - Enter amount: `$100.00`
   - Click "Continue to Payment"
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/28`)
   - CVC: Any 3 digits (e.g., `123`)
   - Submit payment
   - **Expected:** Success message, payment intent created in Stripe dashboard

3. **Test Payment Decline**
   - Use test card: `4000 0000 0000 0002`
   - **Expected:** Payment declined error message

4. **Test 3D Secure Authentication**
   - Use test card: `4000 0025 0000 3155`
   - **Expected:** 3D Secure authentication modal appears

5. **Test Webhook Delivery**
   - Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
   - Login: `stripe login`
   - Forward webhooks:
     ```bash
     stripe listen --forward-to localhost:3000/api/webhooks/stripe
     ```
   - Copy the webhook signing secret shown (starts with `whsec_`)
   - Update `STRIPE_WEBHOOK_SECRET` in `.env`
   - Restart dev server
   - Make a test payment
   - **Expected:** Webhook events logged in Stripe CLI output
   - **Expected:** Payment status updated to `SUCCEEDED` in database

6. **Verify Payment Status in Database**
   ```bash
   npx prisma studio
   ```
   - Navigate to `Payment` table
   - Find your test payment
   - **Expected:** `status = SUCCEEDED`, `stripePaymentIntentId` populated

---

### 4.2.7 Test Photo Upload/Download

**Goal:** Verify photo upload to S3 with compression and signed URL generation.

**Steps:**

1. **Verify AWS S3 Bucket Configuration**
   - Ensure bucket exists in AWS console
   - Verify bucket permissions allow uploads from your IAM credentials
   - Recommended policy: Allow `PutObject`, `DeleteObject`, `GetObject` for your prefix

2. **Test Photo Upload**
   - Navigate to memorial photos page: `http://localhost:3000/portal/memorials/[memorial-id]/photos`
   - Select 2-3 test images (various sizes, ideally one >5MB)
   - Add captions (optional)
   - Click "Upload X Photos"
   - **Expected:** Console logs show compression ratios
   - **Expected:** Success message appears
   - **Expected:** Files appear in S3 bucket under `photos/[memorial-id]/` prefix

3. **Verify S3 Upload in AWS Console**
   - Open AWS S3 console
   - Navigate to your bucket
   - Check `photos/[memorial-id]/` folder
   - **Expected:** Files present with timestamp-random-filename format
   - **Expected:** Content-Type set to `image/jpeg`
   - **Expected:** Cache-Control header: `public, max-age=31536000, immutable`

4. **Test Image Compression**
   - Check console logs for before/after sizes
   - **Expected:** Large images (>2MB) compressed to ≤2MB
   - **Expected:** Max dimensions: 1920px width/height
   - **Expected:** All images converted to JPEG format

5. **Test Signed URL Generation**
   - Run in browser console (on photos page):
     ```javascript
     fetch('/api/photos/[photo-id]/download')
       .then(r => r.json())
       .then(data => {
         console.log('Signed URL:', data.url);
         window.open(data.url, '_blank');
       });
     ```
   - **Expected:** Presigned S3 URL returned
   - **Expected:** URL opens image in new tab
   - **Expected:** URL expires after configured time (default: 1 hour)

6. **Test File Upload Error Handling**
   - Try uploading unsupported file type (e.g., `.txt`, `.pdf`)
   - **Expected:** Error message: "Invalid file type"
   - Try uploading file >10MB (before compression)
   - **Expected:** Upload succeeds if compresses below 10MB, else error

---

### 4.3.4 Test Webhook Resilience

**Goal:** Verify webhook signature validation, error handling, and retry behavior.

**Steps:**

1. **Test Signature Verification**
   - Ensure Stripe CLI is forwarding webhooks (see 4.1.8)
   - Send test webhook with invalid signature:
     ```bash
     curl -X POST http://localhost:3000/api/webhooks/stripe \
       -H "Content-Type: application/json" \
       -H "stripe-signature: invalid" \
       -d '{"type":"payment_intent.succeeded","id":"evt_test"}'
     ```
   - **Expected:** 400 error response
   - **Expected:** Log message: "Webhook signature verification failed"

2. **Test Webhook Event Handling**
   - Use Stripe CLI to send test events:
     ```bash
     stripe trigger payment_intent.succeeded
     stripe trigger payment_intent.payment_failed
     stripe trigger payment_intent.canceled
     ```
   - **Expected:** Console logs show event processing
   - **Expected:** Payment records updated with correct status
   - **Expected:** 200 OK response for all events

3. **Test Idempotency**
   - Send same webhook event twice:
     ```bash
     stripe trigger payment_intent.succeeded
     # Wait a moment, then send again
     stripe trigger payment_intent.succeeded
     ```
   - **Expected:** Both requests return 200 OK
   - **Expected:** Payment record only updated once (check timestamp)
   - **Expected:** No duplicate processing logged

4. **Test Unknown Event Types**
   - Send webhook with unknown event type:
     ```bash
     stripe trigger customer.created
     ```
   - **Expected:** 200 OK response (gracefully ignored)
   - **Expected:** Log message: "Unhandled event type"

5. **Test Webhook Retry Behavior** (Stripe's built-in retry)
   - Stop your dev server
   - Send test webhook via Stripe CLI
   - **Expected:** Stripe CLI shows failed delivery
   - Restart dev server
   - **Expected:** Stripe automatically retries (within ~1 minute)
   - **Expected:** Webhook processed successfully on retry

6. **Verify Webhook Logs**
   - Check console output for all webhook events
   - **Expected:** Each event logs:
     - Event ID (e.g., `evt_...`)
     - Event type
     - Payment intent ID
     - Processing status (success/failure)
     - Any errors

---

## Success Criteria

All tasks above should complete without errors. If any test fails:

1. Check environment variables are set correctly
2. Verify Stripe/AWS credentials have proper permissions
3. Check console/terminal logs for error details
4. Review webhook endpoint logs in Stripe dashboard
5. Inspect database records with `npx prisma studio`

---

## Notes

- **Stripe Test Mode:** All tests use Stripe test mode. No real payments are processed.
- **AWS Costs:** S3 storage and requests may incur small costs (typically <$0.01 for testing).
- **Cleanup:** Delete test photos from S3 bucket after testing to avoid storage costs.
- **Webhook Secret:** When using Stripe CLI `listen` command, the webhook secret changes each time. Update `.env` accordingly.

---

## Next Steps

After completing all manual tests:
- Document any issues or edge cases discovered
- Update `.env.example` with any missing variables
- Consider adding automated integration tests for CI/CD
- Move to next development phase
