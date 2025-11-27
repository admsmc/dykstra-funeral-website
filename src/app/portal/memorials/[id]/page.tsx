'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dykstra/ui/card';
import { Button } from '@dykstra/ui/button';
import { Input } from '@dykstra/ui/input';
import { Textarea } from '@dykstra/ui/textarea';
import { useToast } from '@dykstra/ui/toast';
import { Select } from '@dykstra/ui/select';

// Mock data - in production, fetch via tRPC
const MOCK_MEMORIAL = {
  id: 'memorial-1',
  caseId: 'case-1',
  decedentName: 'John David Smith',
  dateOfBirth: '1945-03-15',
  dateOfDeath: '2024-11-20',
  obituary: 'John David Smith, 79, of Grand Rapids, passed away peacefully on November 20, 2024. He was a beloved husband, father, grandfather, and friend who will be deeply missed by all who knew him.',
  serviceDetails: {
    date: '2024-11-30',
    time: '2:00 PM',
    location: 'Dykstra Funeral Home Chapel',
  },
};

const MOCK_PHOTOS = [
  { id: '1', url: '/placeholder-photo.jpg', caption: 'Family gathering, 2020', uploadedBy: 'Jane Smith' },
  { id: '2', url: '/placeholder-photo.jpg', caption: 'Fishing trip', uploadedBy: 'Robert Smith' },
  { id: '3', url: '/placeholder-photo.jpg', caption: 'Birthday celebration', uploadedBy: 'Mary Johnson' },
  { id: '4', url: '/placeholder-photo.jpg', caption: 'With grandchildren', uploadedBy: 'Jane Smith' },
];

const MOCK_TRIBUTES = [
  {
    id: '1',
    authorName: 'Sarah Johnson',
    message: 'John was a wonderful neighbor and friend. His kindness and generosity will never be forgotten.',
    createdAt: '2024-11-22T10:30:00Z',
  },
  {
    id: '2',
    authorName: 'Michael Brown',
    message: 'We will miss his stories and laughter. Rest in peace, old friend.',
    createdAt: '2024-11-23T14:15:00Z',
  },
];

const MOCK_GUESTBOOK = [
  {
    id: '1',
    name: 'Emily Davis',
    location: 'Grand Rapids, MI',
    message: 'Our thoughts and prayers are with your family during this difficult time.',
    createdAt: '2024-11-22T09:00:00Z',
  },
  {
    id: '2',
    name: 'Thomas Wilson',
    location: 'Lansing, MI',
    message: 'John was a great man who touched many lives. Deepest condolences.',
    createdAt: '2024-11-23T16:45:00Z',
  },
];

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

  // View modes
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'tributes' | 'guestbook'>('overview');
  const [slideshowMode, setSlideshowMode] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Forms
  const [tributeForm, setTributeForm] = useState({ name: '', email: '', message: '' });
  const [guestbookForm, setGuestbookForm] = useState({ name: '', email: '', message: '', city: '', state: '' });

  const memorial = MOCK_MEMORIAL;
  const photos = MOCK_PHOTOS;
  const tributes = MOCK_TRIBUTES;
  const guestbook = MOCK_GUESTBOOK;

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

  // Form handlers
  const handleSubmitTribute = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call tRPC mutation
    toast({
      title: 'Tribute Submitted',
      description: 'Your tribute will be reviewed before being published.',
      variant: 'success',
    });
    setTributeForm({ name: '', email: '', message: '' });
  };

  const handleSignGuestbook = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call tRPC mutation
    toast({
      title: 'Guestbook Signed',
      description: 'Thank you for signing the guestbook.',
      variant: 'success',
    });
    setGuestbookForm({ name: '', email: '', message: '', city: '', state: '' });
  };

  const handleShare = (platform: 'facebook' | 'twitter' | 'email' | 'copy') => {
    const url = window.location.href;
    const text = `In loving memory of ${memorial.decedentName}`;

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
                <form onSubmit={handleSubmitTribute} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[--navy] mb-2">
                      Your Name *
                    </label>
                    <Input
                      value={tributeForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setTributeForm({ ...tributeForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[--navy] mb-2">
                      Email (optional)
                    </label>
                    <Input
                      type="email"
                      value={tributeForm.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setTributeForm({ ...tributeForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[--navy] mb-2">
                      Message *
                    </label>
                    <Textarea
                      value={tributeForm.message}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setTributeForm({ ...tributeForm, message: e.target.value })}
                      rows={5}
                      required
                      maxLength={5000}
                    />
                    <p className="text-xs text-[--charcoal] mt-1">
                      {tributeForm.message.length} / 5000
                    </p>
                  </div>
                  <Button type="submit" className="w-full">Submit Tribute</Button>
                </form>
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
                <form onSubmit={handleSignGuestbook} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[--navy] mb-2">
                      Name *
                    </label>
                    <Input
                      value={guestbookForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setGuestbookForm({ ...guestbookForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[--navy] mb-2">
                      Email (optional)
                    </label>
                    <Input
                      type="email"
                      value={guestbookForm.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setGuestbookForm({ ...guestbookForm, email: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[--navy] mb-2">
                        City
                      </label>
                      <Input
                        value={guestbookForm.city}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setGuestbookForm({ ...guestbookForm, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[--navy] mb-2">
                        State
                      </label>
                      <select
                        value={guestbookForm.state}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setGuestbookForm({ ...guestbookForm, state: e.target.value })}
                        className="w-full px-3 py-2 border border-[--sage] rounded-md"
                      >
                        <option value="">Select</option>
                        {US_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[--navy] mb-2">
                      Message *
                    </label>
                    <Textarea
                      value={guestbookForm.message}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setGuestbookForm({ ...guestbookForm, message: e.target.value })}
                      rows={4}
                      required
                      maxLength={2000}
                    />
                    <p className="text-xs text-[--charcoal] mt-1">
                      {guestbookForm.message.length} / 2000
                    </p>
                  </div>
                  <Button type="submit" className="w-full">Sign Guestbook</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
