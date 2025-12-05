'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, useToast } from '@dykstra/ui';
import { tributeSchema, guestbookSchema, type TributeForm, type GuestbookForm } from '@dykstra/domain/validation';
import { Form, FormInput, FormTextarea, FormSelect } from '@dykstra/ui';
import { Loader2 } from 'lucide-react';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export default function MemorialPage() {
  const params = useParams();
  const memorialId = params.id as string;
  const { toast } = useToast();

  // Fetch memorial data
  const { data: memorial, isLoading: memorialLoading, error: memorialError } = trpc.memorial.get.useQuery({ memorialId });
  const { data: photosData, isLoading: photosLoading } = trpc.memorial.getPhotos.useQuery({ memorialId });
  const { data: tributesData, isLoading: tributesLoading } = trpc.memorial.getTributes.useQuery({ memorialId });
  const { data: guestbookData, isLoading: guestbookLoading } = trpc.memorial.getGuestbook.useQuery({ memorialId });

  // Mutations
  const addTributeMutation = trpc.memorial.addTribute.useMutation();
  const signGuestbookMutation = trpc.memorial.signGuestbook.useMutation();

  // View modes
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'tributes' | 'guestbook'>('overview');
  const [slideshowMode, setSlideshowMode] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Tribute form with react-hook-form
  const tributeForm = useForm<TributeForm>({
    resolver: zodResolver(tributeSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  // Guestbook form with react-hook-form
  const guestbookForm = useForm<GuestbookForm>({
    resolver: zodResolver(guestbookSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      city: '',
      state: '',
    },
  });

  // Extract data from queries
  const photos = photosData?.photos || [];
  const tributes = tributesData?.tributes || [];
  const guestbook = guestbookData?.entries || [];

  // Slideshow controls
  const startSlideshow = () => {
    setSlideshowMode(true);
    setCurrentSlideIndex(0);
  };

  const exitSlideshow = () => {
    setSlideshowMode(false);
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % photos.length);
  };

  const previousSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Form handlers (validation automatic via react-hook-form)
  const onSubmitTribute = tributeForm.handleSubmit(async (data) => {
    try {
      await addTributeMutation.mutateAsync({
        memorialId,
        name: data.name,
        email: data.email,
        message: data.message,
      });
      toast({
        title: 'Tribute Submitted',
        description: 'Your tribute will be reviewed before being published.',
        variant: 'success',
      });
      tributeForm.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit tribute. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const onSignGuestbook = guestbookForm.handleSubmit(async (data) => {
    try {
      await signGuestbookMutation.mutateAsync({
        memorialId,
        name: data.name,
        email: data.email,
        message: data.message,
        city: data.city,
        state: data.state,
      });
      toast({
        title: 'Guestbook Signed',
        description: 'Thank you for signing the guestbook.',
        variant: 'success',
      });
      guestbookForm.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign guestbook. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleShare = (platform: 'facebook' | 'twitter' | 'email' | 'copy') => {
    const url = window.location.href;
    const text = `In loving memory of ${memorial?.decedentName}`;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: 'Link Copied',
          description: 'Memorial link copied to clipboard',
          variant: 'success',
        });
        break;
    }
  };

  // Loading state
  if (memorialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[--navy]" />
      </div>
    );
  }

  // Error state
  if (memorialError || !memorial) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading memorial: {memorialError?.message || 'Memorial not found'}</p>
      </div>
    );
  }

  // Slideshow fullscreen mode
  if (slideshowMode) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Slideshow controls */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10">
          <div className="flex justify-between items-center">
            <span className="text-white text-lg">
              {currentSlideIndex + 1} / {photos.length}
            </span>
            <Button
              onClick={exitSlideshow}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              Exit Slideshow
            </Button>
          </div>
        </div>

        {/* Current photo */}
        <div className="flex-1 flex items-center justify-center relative">
          <Button
            onClick={previousSlide}
            variant="ghost"
            className="absolute left-4 text-white hover:bg-white/20 text-4xl p-4"
          >
            ‹
          </Button>

          <div className="max-w-6xl max-h-[80vh] flex flex-col items-center">
            <div className="w-full h-[70vh] bg-[--charcoal] flex items-center justify-center">
              <div className="text-white text-2xl">Photo: {photos[currentSlideIndex].caption}</div>
            </div>
            <p className="text-white mt-4 text-center">{photos[currentSlideIndex].caption}</p>
          </div>

          <Button
            onClick={nextSlide}
            variant="ghost"
            className="absolute right-4 text-white hover:bg-white/20 text-4xl p-4"
          >
            ›
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Memorial Header */}
      <div className="bg-[--cream] rounded-lg p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-[--navy] mb-2">
              {memorial.decedentName}
            </h1>
            <p className="text-xl text-[--charcoal]">
              {new Date(memorial.dateOfBirth).toLocaleDateString()} - {new Date(memorial.dateOfDeath).toLocaleDateString()}
            </p>
          </div>
          
          {/* Share buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => handleShare('facebook')}>
              Share on Facebook
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
              Share on Twitter
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare('email')}>
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare('copy')}>
              Copy Link
            </Button>
          </div>
        </div>

        {/* Service details */}
        {memorial.serviceDetails && (
          <div className="mt-6 p-4 bg-white rounded-lg">
            <h3 className="font-semibold text-[--navy] mb-2">Service Information</h3>
            <p className="text-[--charcoal]">
              {new Date(memorial.serviceDetails.date).toLocaleDateString()} at {memorial.serviceDetails.time}
            </p>
            <p className="text-[--charcoal]">{memorial.serviceDetails.location}</p>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-[--sage]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-[--navy] border-b-2 border-[--navy]'
              : 'text-[--charcoal] hover:text-[--navy]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'photos'
              ? 'text-[--navy] border-b-2 border-[--navy]'
              : 'text-[--charcoal] hover:text-[--navy]'
          }`}
        >
          Photos ({photos.length})
        </button>
        <button
          onClick={() => setActiveTab('tributes')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'tributes'
              ? 'text-[--navy] border-b-2 border-[--navy]'
              : 'text-[--charcoal] hover:text-[--navy]'
          }`}
        >
          Tributes ({tributes.length})
        </button>
        <button
          onClick={() => setActiveTab('guestbook')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'guestbook'
              ? 'text-[--navy] border-b-2 border-[--navy]'
              : 'text-[--charcoal] hover:text-[--navy]'
          }`}
        >
          Guestbook ({guestbook.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-[--navy]">Obituary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[--charcoal] leading-relaxed">{memorial.obituary}</p>
            </CardContent>
          </Card>

          {/* Recent photos preview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-serif text-[--navy]">Photos</CardTitle>
                <Button variant="outline" onClick={() => setActiveTab('photos')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.slice(0, 4).map((photo) => (
                  <div key={photo.id} className="aspect-square bg-[--cream] rounded-lg overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-[--sage]">
                      Photo: {photo.caption}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent tributes preview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-serif text-[--navy]">Recent Tributes</CardTitle>
                <Button variant="outline" onClick={() => setActiveTab('tributes')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tributes.slice(0, 2).map((tribute) => (
                  <div key={tribute.id} className="p-4 bg-[--cream] rounded-lg">
                    <p className="text-[--charcoal] mb-2">{tribute.message}</p>
                    <div className="flex justify-between items-center text-sm text-[--sage]">
                      <span>{tribute.authorName}</span>
                      <span>{new Date(tribute.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif font-bold text-[--navy]">Photo Gallery</h2>
            <Button onClick={startSlideshow}>Start Slideshow</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="cursor-pointer group"
                onClick={() => {
                  setCurrentSlideIndex(index);
                  setSlideshowMode(true);
                }}
              >
                <div className="aspect-square bg-[--cream] rounded-lg overflow-hidden mb-2 group-hover:ring-2 group-hover:ring-[--navy] transition-all">
                  <div className="w-full h-full flex items-center justify-center text-[--sage]">
                    Photo {index + 1}
                  </div>
                </div>
                <p className="text-sm text-[--navy] font-medium">{photo.caption}</p>
                <p className="text-xs text-[--charcoal]">By {photo.uploadedBy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tributes Tab */}
      {activeTab === 'tributes' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-serif font-bold text-[--navy]">Tributes</h2>
            {tributes.map((tribute) => (
              <Card key={tribute.id}>
                <CardContent className="pt-6">
                  <p className="text-[--charcoal] mb-4">{tribute.message}</p>
                  <div className="flex justify-between items-center text-sm text-[--sage]">
                    <span className="font-medium">{tribute.authorName}</span>
                    <span>{new Date(tribute.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add tribute form */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-[--navy]">Leave a Tribute</CardTitle>
                <CardDescription>Your message will be reviewed before posting</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...tributeForm}>
                  <form onSubmit={onSubmitTribute} className="space-y-4">
                    <FormInput
                      name="name"
                      label="Your Name"
                      required
                    />

                    <FormInput
                      name="email"
                      label="Email"
                      type="email"
                      required
                    />

                    <FormTextarea
                      name="message"
                      label="Message"
                      rows={5}
                      maxLength={2000}
                      showCharacterCount
                      required
                    />

                    <Button type="submit" className="w-full">Submit Tribute</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Guestbook Tab */}
      {activeTab === 'guestbook' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-serif font-bold text-[--navy]">
              Guestbook ({guestbook.length} entries)
            </h2>
            {guestbook.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="pt-6">
                  <p className="text-[--charcoal] mb-4">{entry.message}</p>
                  <div className="flex justify-between items-center text-sm text-[--sage]">
                    <div>
                      <span className="font-medium">{entry.name}</span>
                      {entry.location && <span className="ml-2">• {entry.location}</span>}
                    </div>
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sign guestbook form */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-[--navy]">Sign Guestbook</CardTitle>
                <CardDescription>Share your condolences with the family</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...guestbookForm}>
                  <form onSubmit={onSignGuestbook} className="space-y-4">
                    <FormInput
                      name="name"
                      label="Name"
                      required
                    />

                    <FormInput
                      name="email"
                      label="Email"
                      type="email"
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        name="city"
                        label="City"
                      />

                      <FormSelect
                        name="state"
                        label="State"
                        placeholder="Select"
                        options={US_STATES.map((state) => ({
                          value: state,
                          label: state,
                        }))}
                      />
                    </div>

                    <FormTextarea
                      name="message"
                      label="Message"
                      rows={4}
                      maxLength={2000}
                      showCharacterCount
                      required
                    />

                    <Button type="submit" className="w-full">Sign Guestbook</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
