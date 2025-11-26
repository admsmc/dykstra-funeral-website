'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@dykstra/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dykstra/ui/card';
import { Input } from '@dykstra/ui/input';
import { Textarea } from '@dykstra/ui/textarea';
import { RadioGroup } from '@dykstra/ui/radio-group';
import { Toast, useToast } from '@dykstra/ui/toast';

type ServiceType = 'traditional_burial' | 'traditional_cremation' | 'memorial_service' | 'direct_burial' | 'direct_cremation' | 'celebration_of_life';

interface Product {
  id: string;
  type: 'casket' | 'urn' | 'flowers' | 'other';
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  selected: boolean;
}

const SERVICE_TYPES: Array<{ value: ServiceType; label: string; description: string }> = [
  {
    value: 'traditional_burial',
    label: 'Traditional Funeral with Burial',
    description: 'Full service with visitation, funeral ceremony, and burial',
  },
  {
    value: 'traditional_cremation',
    label: 'Traditional Funeral with Cremation',
    description: 'Full service with visitation, funeral ceremony, and cremation',
  },
  {
    value: 'memorial_service',
    label: 'Memorial Service',
    description: 'Service held after cremation or burial has taken place',
  },
  {
    value: 'direct_burial',
    label: 'Direct Burial',
    description: 'Burial without formal viewing or ceremony',
  },
  {
    value: 'direct_cremation',
    label: 'Direct Cremation',
    description: 'Cremation without formal viewing or ceremony',
  },
  {
    value: 'celebration_of_life',
    label: 'Celebration of Life',
    description: 'Personalized gathering focused on celebrating the life lived',
  },
];

// Sample product catalog - in production, fetch from backend
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'casket-oak',
    type: 'casket',
    name: 'Oak Casket',
    description: 'Solid oak wood casket with velvet interior',
    price: 3500,
    imageUrl: null,
    selected: false,
  },
  {
    id: 'casket-mahogany',
    type: 'casket',
    name: 'Mahogany Casket',
    description: 'Premium mahogany wood casket',
    price: 5500,
    imageUrl: null,
    selected: false,
  },
  {
    id: 'urn-bronze',
    type: 'urn',
    name: 'Bronze Urn',
    description: 'Elegant bronze cremation urn',
    price: 450,
    imageUrl: null,
    selected: false,
  },
  {
    id: 'urn-ceramic',
    type: 'urn',
    name: 'Ceramic Urn',
    description: 'Hand-crafted ceramic urn',
    price: 350,
    imageUrl: null,
    selected: false,
  },
  {
    id: 'flowers-spray',
    type: 'flowers',
    name: 'Casket Spray',
    description: 'Full casket spray with roses and lilies',
    price: 350,
    imageUrl: null,
    selected: false,
  },
  {
    id: 'flowers-wreath',
    type: 'flowers',
    name: 'Standing Wreath',
    description: 'Standing floral wreath',
    price: 250,
    imageUrl: null,
    selected: false,
  },
];

export default function ArrangementsPage() {
  const params = useParams();
  const caseId = params.id as string;
  const { toast } = useToast();

  // Fetch arrangements
  const { data: arrangements, isLoading, refetch } = trpc.arrangements.get.useQuery({ caseId });

  // Save mutation
  const saveMutation = trpc.arrangements.save.useMutation({
    onSuccess: () => {
      toast({
        title: 'Saved',
        description: 'Arrangements have been saved successfully',
        variant: 'success',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Local state for form
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [ceremonyDate, setCeremonyDate] = useState('');
  const [ceremonyTime, setCeremonyTime] = useState('');
  const [location, setLocation] = useState('');
  const [officiant, setOfficiant] = useState('');
  const [musicSelections, setMusicSelections] = useState('');
  const [readings, setReadings] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [newNote, setNewNote] = useState('');

  // Initialize form from fetched data
  useState(() => {
    if (arrangements) {
      setSelectedServiceType(arrangements.serviceType);
      if (arrangements.products.length > 0) {
        setProducts(prevProducts =>
          prevProducts.map(p => ({
            ...p,
            selected: arrangements.products.some(ap => ap.id === p.id && ap.selected),
          }))
        );
      }
      if (arrangements.ceremony.date) {
        const date = new Date(arrangements.ceremony.date);
        setCeremonyDate(date.toISOString().split('T')[0]);
      }
      setCeremonyTime(arrangements.ceremony.time || '');
      setLocation(arrangements.ceremony.location || '');
      setOfficiant(arrangements.ceremony.officiant || '');
      setMusicSelections(arrangements.ceremony.musicSelections?.join('\n') || '');
      setReadings(arrangements.ceremony.readings?.join('\n') || '');
      setSpecialRequests(arrangements.ceremony.specialRequests || '');
    }
  }, [arrangements]);

  const handleSaveServiceType = () => {
    if (!selectedServiceType) return;
    saveMutation.mutate({ caseId, serviceType: selectedServiceType });
  };

  const handleToggleProduct = (productId: string) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleSaveProducts = () => {
    saveMutation.mutate({ caseId, products });
  };

  const handleSaveCeremony = () => {
    saveMutation.mutate({
      caseId,
      ceremony: {
        date: ceremonyDate ? new Date(ceremonyDate) : null,
        time: ceremonyTime || null,
        location: location || null,
        officiant: officiant || null,
        musicSelections: musicSelections ? musicSelections.split('\n').filter(Boolean) : [],
        readings: readings ? readings.split('\n').filter(Boolean) : [],
        specialRequests: specialRequests || null,
      },
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    saveMutation.mutate({ caseId, note: newNote });
    setNewNote('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[--sage]">Loading arrangements...</div>
      </div>
    );
  }

  const selectedProducts = products.filter(p => p.selected);
  const totalCost = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Progress Header */}
      <div className="bg-[--cream] rounded-lg p-6">
        <h1 className="text-3xl font-serif font-bold text-[--navy] mb-2">
          Arrangement Planning
        </h1>
        <p className="text-[--charcoal] mb-4">
          Collaborate with your funeral director to plan the service details
        </p>
        {arrangements && (
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-white rounded-full h-3 overflow-hidden">
              <div
                className="bg-[--navy] h-full transition-all duration-300"
                style={{ width: `${arrangements.completionPercentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-[--navy]">
              {arrangements.completionPercentage}% Complete
            </span>
          </div>
        )}
      </div>

      {/* Section 1: Service Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-[--navy]">
            1. Service Type
          </CardTitle>
          <CardDescription>
            Choose the type of service that best honors your loved one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={selectedServiceType || ''}
            onValueChange={(value) => setSelectedServiceType(value as ServiceType)}
          >
            {SERVICE_TYPES.map((serviceType) => (
              <div
                key={serviceType.value}
                className="flex items-start gap-4 p-4 border border-[--sage] rounded-lg hover:bg-[--cream] transition-colors cursor-pointer"
              >
                <input
                  type="radio"
                  value={serviceType.value}
                  checked={selectedServiceType === serviceType.value}
                  onChange={() => setSelectedServiceType(serviceType.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-[--navy]">{serviceType.label}</h3>
                  <p className="text-sm text-[--charcoal]">{serviceType.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
          <Button
            onClick={handleSaveServiceType}
            disabled={!selectedServiceType || saveMutation.isLoading}
            className="w-full sm:w-auto"
          >
            Save Service Type
          </Button>
        </CardContent>
      </Card>

      {/* Section 2: Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-[--navy]">
            2. Product Selection
          </CardTitle>
          <CardDescription>
            Select casket, urn, flowers, and other items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Caskets */}
          {selectedServiceType?.includes('burial') && (
            <div>
              <h3 className="text-lg font-semibold text-[--navy] mb-3">Caskets</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {products
                  .filter((p) => p.type === 'casket')
                  .map((product) => (
                    <div
                      key={product.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        product.selected
                          ? 'border-[--navy] bg-[--cream]'
                          : 'border-[--sage] hover:border-[--navy]'
                      }`}
                      onClick={() => handleToggleProduct(product.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[--navy]">{product.name}</h4>
                          <p className="text-sm text-[--charcoal] mt-1">
                            {product.description}
                          </p>
                          <p className="text-lg font-semibold text-[--navy] mt-2">
                            ${product.price.toLocaleString()}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={product.selected}
                          onChange={() => handleToggleProduct(product.id)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Urns */}
          {selectedServiceType?.includes('cremation') && (
            <div>
              <h3 className="text-lg font-semibold text-[--navy] mb-3">Urns</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {products
                  .filter((p) => p.type === 'urn')
                  .map((product) => (
                    <div
                      key={product.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        product.selected
                          ? 'border-[--navy] bg-[--cream]'
                          : 'border-[--sage] hover:border-[--navy]'
                      }`}
                      onClick={() => handleToggleProduct(product.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[--navy]">{product.name}</h4>
                          <p className="text-sm text-[--charcoal] mt-1">
                            {product.description}
                          </p>
                          <p className="text-lg font-semibold text-[--navy] mt-2">
                            ${product.price.toLocaleString()}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={product.selected}
                          onChange={() => handleToggleProduct(product.id)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Flowers */}
          <div>
            <h3 className="text-lg font-semibold text-[--navy] mb-3">Flowers</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {products
                .filter((p) => p.type === 'flowers')
                .map((product) => (
                  <div
                    key={product.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      product.selected
                        ? 'border-[--navy] bg-[--cream]'
                        : 'border-[--sage] hover:border-[--navy]'
                    }`}
                    onClick={() => handleToggleProduct(product.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[--navy]">{product.name}</h4>
                        <p className="text-sm text-[--charcoal] mt-1">
                          {product.description}
                        </p>
                        <p className="text-lg font-semibold text-[--navy] mt-2">
                          ${product.price.toLocaleString()}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={product.selected}
                        onChange={() => handleToggleProduct(product.id)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Total */}
          {selectedProducts.length > 0 && (
            <div className="border-t border-[--sage] pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-[--navy]">
                  Selected Items Total:
                </span>
                <span className="text-2xl font-bold text-[--navy]">
                  ${totalCost.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={handleSaveProducts}
            disabled={saveMutation.isLoading}
            className="w-full sm:w-auto"
          >
            Save Product Selection
          </Button>
        </CardContent>
      </Card>

      {/* Section 3: Ceremony Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-[--navy]">
            3. Ceremony Details
          </CardTitle>
          <CardDescription>
            Plan the service date, location, and special elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[--navy] mb-2">
                Service Date
              </label>
              <Input
                type="date"
                value={ceremonyDate}
                onChange={(e) => setCeremonyDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[--navy] mb-2">
                Service Time
              </label>
              <Input
                type="time"
                value={ceremonyTime}
                onChange={(e) => setCeremonyTime(e.target.value)}
                placeholder="HH:MM"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[--navy] mb-2">
              Location
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Dykstra Funeral Home Chapel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[--navy] mb-2">
              Officiant
            </label>
            <Input
              value={officiant}
              onChange={(e) => setOfficiant(e.target.value)}
              placeholder="Name of clergy or officiant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[--navy] mb-2">
              Music Selections
            </label>
            <Textarea
              value={musicSelections}
              onChange={(e) => setMusicSelections(e.target.value)}
              placeholder="Enter one song per line&#10;e.g., Amazing Grace&#10;e.g., Ave Maria"
              rows={4}
            />
            <p className="text-xs text-[--charcoal] mt-1">One song per line</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[--navy] mb-2">
              Readings
            </label>
            <Textarea
              value={readings}
              onChange={(e) => setReadings(e.target.value)}
              placeholder="Enter one reading per line&#10;e.g., Psalm 23&#10;e.g., Do Not Stand at My Grave and Weep"
              rows={4}
            />
            <p className="text-xs text-[--charcoal] mt-1">One reading per line</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[--navy] mb-2">
              Special Requests
            </label>
            <Textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any special requests or considerations for the service"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSaveCeremony}
            disabled={saveMutation.isLoading}
            className="w-full sm:w-auto"
          >
            Save Ceremony Details
          </Button>
        </CardContent>
      </Card>

      {/* Section 4: Collaborative Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-[--navy]">
            4. Collaborative Notes
          </CardTitle>
          <CardDescription>
            Share thoughts and questions with your funeral director
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Notes */}
          {arrangements?.notes && arrangements.notes.length > 0 && (
            <div className="space-y-3 mb-6">
              {arrangements.notes.map((note) => (
                <div key={note.id} className="bg-[--cream] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-[--navy]">{note.authorName}</span>
                    <span className="text-xs text-[--charcoal]">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[--charcoal] whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Note Form */}
          <div className="space-y-3">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note or question..."
              rows={3}
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || saveMutation.isLoading}
              className="w-full sm:w-auto"
            >
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
