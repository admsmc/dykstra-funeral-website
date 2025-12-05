'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/toast';

/**
 * Family-Facing Template Customization Page
 * 
 * Simplified interface for families to personalize memorial templates.
 * 
 * Features:
 * - Pre-built template selection
 * - Simple form fields (no drag-and-drop)
 * - Text and photo customization only
 * - Live preview
 * - Generate final PDF
 * 
 * Route: /customize-template (family accessible)
 */
export default function CustomizeTemplatePage() {
  const toast = useToast();
  const [step, setStep] = useState<'select' | 'customize' | 'preview'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    deceasedName: '',
    birthDate: '',
    deathDate: '',
    photoUrl: '',
    obituary: '',
    serviceDate: '',
    serviceLocation: '',
    orderOfService: [
      { item: 'Opening Prayer', officiant: '' },
      { item: 'Eulogy', officiant: '' },
      { item: 'Closing Prayer', officiant: '' },
    ],
    pallbearers: ['', '', '', '', '', ''],
    funeralHomeName: 'Dykstra Funeral Home',
    funeralHomeAddress: '123 Main Street, Anytown, MI 12345',
    funeralHomePhone: '(555) 123-4567',
  });

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const templatesQuery = trpc.memorialTemplates.listTemplates.useQuery({
    category: 'service_program',
  });

  const generatePdfMutation = trpc.memorialTemplates.generateServiceProgram.useMutation();

  const handleGeneratePdf = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    try {
      const result = await generatePdfMutation.mutateAsync({
        templateBusinessKey: selectedTemplate,
        data: {
          deceasedName: formData.deceasedName,
          birthDate: formData.birthDate,
          deathDate: formData.deathDate,
          photoUrl: formData.photoUrl,
          orderOfService: formData.orderOfService.filter((item) => item.item.trim() !== ''),
          obituary: formData.obituary,
          pallbearers: formData.pallbearers.filter((p) => p.trim() !== ''),
          funeralHomeName: formData.funeralHomeName,
          funeralHomeAddress: formData.funeralHomeAddress,
          funeralHomePhone: formData.funeralHomePhone,
        },
      });

      const pdfBlob = new Blob(
        [Uint8Array.from(atob(result.pdfBuffer), (c) => c.charCodeAt(0))],
        { type: 'application/pdf' }
      );
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setStep('preview');
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${formData.deceasedName.replace(/\s+/g, '_')}_Service_Program.pdf`;
    link.click();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f3ed' }}>
      {/* Header */}
      <div
        style={{
          padding: '40px 20px',
          backgroundColor: '#1e3a5f',
          color: 'white',
          borderBottom: '4px solid #8b9d83',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '36px' }}>
            Customize Memorial Program
          </h1>
          <p style={{ margin: '10px 0 0', fontSize: '16px', opacity: 0.9 }}>
            Create a personalized service program for your loved one
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        {/* Progress Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', gap: '20px' }}>
          {['Select Template', 'Customize', 'Preview & Download'].map((label, index) => {
            const stepName = ['select', 'customize', 'preview'][index];
            const isActive = step === stepName;
            const isCompleted = ['select', 'customize', 'preview'].indexOf(step) > index;

            return (
              <div key={label} style={{ textAlign: 'center', flex: 1, maxWidth: '200px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isActive || isCompleted ? '#1e3a5f' : '#ddd',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                    fontWeight: 'bold',
                  }}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: isActive ? '#1e3a5f' : '#666',
                    fontWeight: isActive ? 'bold' : 'normal',
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step 1: Select Template */}
        {step === 'select' && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '40px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2
              style={{
                margin: '0 0 24px',
                fontFamily: 'Playfair Display, serif',
                color: '#1e3a5f',
              }}
            >
              Choose a Template
            </h2>

            {templatesQuery.isLoading && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Loading templates...
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {templatesQuery.data
                ?.filter((t) => t.metadata.status === 'active')
                .map((template) => (
                  <div
                    key={template.metadata.businessKey}
                    onClick={() => {
                      setSelectedTemplate(template.metadata.businessKey);
                      setStep('customize');
                    }}
                    style={{
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: 'white',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8b9d83';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#ddd';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '12px' }}>
                      📄
                    </div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#1e3a5f',
                        textAlign: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      {template.metadata.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                      {template.settings.pageSize} • {template.settings.orientation}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Step 2: Customize */}
        {step === 'customize' && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '40px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2
              style={{
                margin: '0 0 24px',
                fontFamily: 'Playfair Display, serif',
                color: '#1e3a5f',
              }}
            >
              Personalize Your Program
            </h2>

            <form onSubmit={(e) => e.preventDefault()}>
              {/* Basic Info */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', color: '#1e3a5f', marginBottom: '16px' }}>
                  Basic Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.deceasedName}
                      onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Photo URL (optional)
                    </label>
                    <input
                      type="url"
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      placeholder="https://example.com/photo.jpg"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Birth Date *
                    </label>
                    <input
                      type="text"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      placeholder="January 1, 1950"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Death Date *
                    </label>
                    <input
                      type="text"
                      value={formData.deathDate}
                      onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                      placeholder="December 1, 2024"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Obituary */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Obituary (optional)
                </label>
                <textarea
                  value={formData.obituary}
                  onChange={(e) => setFormData({ ...formData, obituary: e.target.value })}
                  rows={4}
                  placeholder="Brief life story..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Order of Service */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', color: '#1e3a5f', marginBottom: '16px' }}>
                  Order of Service
                </h3>
                {formData.orderOfService.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr', gap: '12px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      value={item.item}
                      onChange={(e) => {
                        const newOrder = [...formData.orderOfService];
                        newOrder[index].item = e.target.value;
                        setFormData({ ...formData, orderOfService: newOrder });
                      }}
                      placeholder="Service item"
                      style={{
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                    <input
                      type="text"
                      value={item.officiant}
                      onChange={(e) => {
                        const newOrder = [...formData.orderOfService];
                        newOrder[index].officiant = e.target.value;
                        setFormData({ ...formData, orderOfService: newOrder });
                      }}
                      placeholder="Led by (optional)"
                      style={{
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      orderOfService: [...formData.orderOfService, { item: '', officiant: '' }],
                    })
                  }
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#8b9d83',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  + Add Item
                </button>
              </div>

              {/* Pallbearers */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', color: '#1e3a5f', marginBottom: '16px' }}>
                  Pallbearers (optional)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {formData.pallbearers.map((name, index) => (
                    <input
                      key={index}
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const newPallbearers = [...formData.pallbearers];
                        newPallbearers[index] = e.target.value;
                        setFormData({ ...formData, pallbearers: newPallbearers });
                      }}
                      placeholder={`Pallbearer ${index + 1}`}
                      style={{
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    color: '#1e3a5f',
                    border: '2px solid #1e3a5f',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePdf}
                  disabled={!formData.deceasedName || !formData.birthDate || !formData.deathDate || isGenerating}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#1e3a5f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: formData.deceasedName && formData.birthDate && formData.deathDate && !isGenerating ? 'pointer' : 'not-allowed',
                    opacity: formData.deceasedName && formData.birthDate && formData.deathDate && !isGenerating ? 1 : 0.5,
                  }}
                >
                  {isGenerating ? 'Generating...' : 'Generate Preview →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Preview & Download */}
        {step === 'preview' && pdfUrl && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '40px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2
              style={{
                margin: '0 0 24px',
                fontFamily: 'Playfair Display, serif',
                color: '#1e3a5f',
              }}
            >
              Preview Your Program
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <iframe
                src={pdfUrl}
                style={{
                  width: '100%',
                  height: '70vh',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
                title="Program Preview"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
              <button
                onClick={() => {
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl(null);
                  setStep('customize');
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#1e3a5f',
                  border: '2px solid #1e3a5f',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                ← Make Changes
              </button>
              <button
                onClick={handleDownload}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                ⬇ Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
