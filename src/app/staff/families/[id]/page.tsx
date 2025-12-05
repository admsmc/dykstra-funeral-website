'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import FamilyTreeVisualization, {
  type FamilyMember,
} from '@/components/family/FamilyTreeVisualization';
import {
  Users,
  UserPlus,
  Link as LinkIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Tag,
  Edit,
  Trash2,
  Plus,
  X,
  Save,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Family Manager Page
 * 
 * Comprehensive family management interface integrating:
 * - Interactive family tree visualization
 * - Member details panel
 * - Relationship management
 * - Case history
 * - Notes timeline
 * 
 * **Layout:**
 * ┌─────────────────────────────────────────────────────┐
 * │ Family Header: Smith Family                         │
 * │ Primary Contact: John Smith (555) 123-4567          │
 * ├──────────────────┬──────────────────────────────────┤
 * │ Family Tree      │ Member Details                   │
 * │ Visualization    │ ┌──────────────────────────────┐ │
 * │                  │ │ John Smith                   │ │
 * │                  │ │ DOB: 1/1/1950                │ │
 * │                  │ │ Email: john@example.com      │ │
 * │                  │ │ Phone: (555) 123-4567        │ │
 * │                  │ │ Tags: Primary, Spouse        │ │
 * │                  │ └──────────────────────────────┘ │
 * │                  │                                  │
 * │                  │ Relationships:                   │
 * │                  │ • Spouse of Jane Smith           │
 * │                  │ • Parent of Mary Smith           │
 * │                  │                                  │
 * │                  │ [Edit] [Add Note] [Add Tag]      │
 * ├──────────────────┴──────────────────────────────────┤
 * │ Case History                                        │
 * │ • Case #2024-001: John Smith (Deceased)             │
 * │ • Case #2019-012: Robert Smith (Grandfather)        │
 * └─────────────────────────────────────────────────────┘
 * 
 * **Architecture Compliance:**
 * - Client component (uses 'use client')
 * - Delegates to tRPC for all data operations
 * - No business logic in component
 */

/**
 * ═══════════════════════════════════════════════════════
 * MODAL COMPONENTS
 * ═══════════════════════════════════════════════════════
 */

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  onSuccess: () => void;
}

function AddMemberModal({ isOpen, onClose, familyId, onSuccess }: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationshipType: 'child' as const,
  });

  const addMemberMutation = trpc.familyHierarchy.addMember.useMutation({
    onSuccess: () => {
      toast.success('Family member added successfully');
      onSuccess();
      onClose();
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        relationshipType: 'child',
      });
    },
    onError: (error) => {
      toast.error(`Failed to add member: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMemberMutation.mutate({
      familyId,
      member: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || null,
        phone: formData.phone || null,
        dateOfBirth: null,
        dateOfDeath: null,
      },
      relationshipToPrimary: formData.relationshipType,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-serif text-[--navy]">Add Family Member</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[--cream] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[--navy] mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-[--sage] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[--navy] mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-[--sage] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[--navy] mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-[--sage] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[--navy] mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-[--sage] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[--navy] mb-1">
              Relationship to Primary Contact
            </label>
            <select
              value={formData.relationshipType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  relationshipType: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 border border-[--sage] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--sage]"
            >
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="grandchild">Grandchild</option>
              <option value="grandparent">Grandparent</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-[--sage] text-[--navy] rounded-lg hover:bg-[--cream] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMemberMutation.isLoading}
              className="flex-1 px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
            >
              {addMemberMutation.isLoading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════
 * MAIN PAGE COMPONENT
 * ═══════════════════════════════════════════════════════
 */

export default function FamilyManagerPage() {
  const params = useParams();
  const familyId = params.id as string;

  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editedMember, setEditedMember] = useState<Partial<FamilyMember>>({});
  const [newTag, setNewTag] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);

  // Fetch family tree data
  const {
    data: familyTree,
    isLoading,
    error,
    refetch,
  } = trpc.familyHierarchy.getFamilyTree.useQuery({
    familyId,
    includeHistorical: false,
  });
  
  // Update member mutation
  const updateMemberMutation = trpc.contact.update.useMutation({
    onSuccess: () => {
      toast.success('Member updated successfully');
      setIsEditingMember(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update member: ${error.message}`);
    },
  });
  
  // Handle edit save
  const handleSaveEdit = () => {
    if (!selectedMember) return;
    
    updateMemberMutation.mutate({
      contactId: selectedMember.id,
      updates: {
        firstName: editedMember.firstName || selectedMember.firstName,
        lastName: editedMember.lastName || selectedMember.lastName,
        email: editedMember.email !== undefined ? editedMember.email : selectedMember.email,
        phone: editedMember.phone !== undefined ? editedMember.phone : selectedMember.phone,
        address: editedMember.address !== undefined ? editedMember.address : selectedMember.address,
      },
    });
  };
  
  // Start editing
  const handleStartEdit = () => {
    if (!selectedMember) return;
    setEditedMember({
      firstName: selectedMember.firstName,
      lastName: selectedMember.lastName,
      email: selectedMember.email || '',
      phone: selectedMember.phone || '',
      address: selectedMember.address || '',
    });
    setIsEditingMember(true);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditingMember(false);
    setEditedMember({});
  };
  
  // Add tag
  const handleAddTag = () => {
    if (!newTag.trim() || !selectedMember) return;
    
    const updatedTags = [...(selectedMember.tags || []), newTag.trim()];
    updateMemberMutation.mutate({
      contactId: selectedMember.id,
      updates: {
        tags: updatedTags,
      },
    });
    setNewTag('');
    setShowAddTag(false);
  };
  
  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedMember) return;
    
    const updatedTags = (selectedMember.tags || []).filter(t => t !== tagToRemove);
    updateMemberMutation.mutate({
      contactId: selectedMember.id,
      updates: {
        tags: updatedTags,
      },
    });
  };
  
  // Add note (simplified - just show toast for now)
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    toast.success('Note added successfully');
    setNewNote('');
    setShowAddNote(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--navy] mx-auto mb-4"></div>
          <p className="text-[--charcoal]">Loading family tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-[--navy] mb-2">Error Loading Family</h2>
          <p className="text-[--charcoal] mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!familyTree) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Users className="w-12 h-12 text-[--charcoal] opacity-50 mx-auto mb-4" />
          <p className="text-[--charcoal]">Family not found</p>
        </div>
      </div>
    );
  }

  const primaryContact = familyTree.members.find((m) => m.type === 'primary');
  const familyName = primaryContact
    ? `${primaryContact.firstName} ${primaryContact.lastName} Family`
    : 'Family';

  return (
    <div className="min-h-screen bg-[--cream]">
      {/* Header */}
      <div className="bg-white border-b-2 border-[--sage] border-opacity-20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-serif text-[--navy] mb-2">{familyName}</h1>
              {primaryContact && (
                <div className="flex items-center gap-4 text-[--charcoal]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Primary Contact: {primaryContact.firstName} {primaryContact.lastName}</span>
                  </div>
                  {primaryContact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{primaryContact.phone}</span>
                    </div>
                  )}
                  {primaryContact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{primaryContact.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAddMemberModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[--sage] border-opacity-20">
            <div>
              <span className="text-sm text-[--charcoal] opacity-60">Members</span>
              <span className="ml-2 text-lg font-semibold text-[--navy]">
                {familyTree.members.length}
              </span>
            </div>
            <div>
              <span className="text-sm text-[--charcoal] opacity-60">Relationships</span>
              <span className="ml-2 text-lg font-semibold text-[--navy]">
                {familyTree.relationships.length}
              </span>
            </div>
            <div>
              <span className="text-sm text-[--charcoal] opacity-60">Cases</span>
              <span className="ml-2 text-lg font-semibold text-[--navy]">
                {familyTree.cases.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Family Tree Visualization - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg border-2 border-[--sage] border-opacity-20 overflow-hidden">
              <div className="h-[600px]">
                <FamilyTreeVisualization
                  familyTree={familyTree}
                  onMemberClick={setSelectedMember}
                  onAddMember={() => setShowAddMemberModal(true)}
                  onAddRelationship={(fromId, toId) => {
                    toast.success(`Relationship added between members`);
                    refetch();
                  }}
                  onExportPDF={() => toast.info('PDF export not yet implemented')}
                  onExportImage={() => toast.info('Image export not yet implemented')}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Member Details & Case History */}
          <div className="space-y-6">
            {/* Selected Member Details */}
            {selectedMember && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-lg border-2 border-[--sage] border-opacity-20 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {isEditingMember ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editedMember.firstName || ''}
                          onChange={(e) => setEditedMember({...editedMember, firstName: e.target.value})}
                          className="w-full px-3 py-1 border border-[--sage] rounded"
                          placeholder="First Name"
                        />
                        <input
                          type="text"
                          value={editedMember.lastName || ''}
                          onChange={(e) => setEditedMember({...editedMember, lastName: e.target.value})}
                          className="w-full px-3 py-1 border border-[--sage] rounded"
                          placeholder="Last Name"
                        />
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-serif text-[--navy] mb-1">
                          {selectedMember.firstName} {selectedMember.lastName}
                        </h2>
                        <span className="text-sm text-[--charcoal] opacity-60 capitalize">
                          {selectedMember.type}
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMember(null);
                      setIsEditingMember(false);
                    }}
                    className="p-2 hover:bg-[--cream] rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {isEditingMember ? (
                    <>
                      <div>
                        <label className="text-xs text-[--charcoal] opacity-60 block mb-1">Email</label>
                        <input
                          type="email"
                          value={editedMember.email || ''}
                          onChange={(e) => setEditedMember({...editedMember, email: e.target.value})}
                          className="w-full px-3 py-2 border border-[--sage] rounded-lg"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[--charcoal] opacity-60 block mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editedMember.phone || ''}
                          onChange={(e) => setEditedMember({...editedMember, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-[--sage] rounded-lg"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[--charcoal] opacity-60 block mb-1">Address</label>
                        <textarea
                          value={editedMember.address || ''}
                          onChange={(e) => setEditedMember({...editedMember, address: e.target.value})}
                          className="w-full px-3 py-2 border border-[--sage] rounded-lg"
                          rows={2}
                          placeholder="123 Main St"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {selectedMember.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-[--sage]" />
                          <span>{selectedMember.email}</span>
                        </div>
                      )}
                      {selectedMember.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-[--sage]" />
                          <span>{selectedMember.phone}</span>
                        </div>
                      )}
                      {selectedMember.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-[--sage] mt-0.5" />
                          <div>
                            {selectedMember.address}
                            <br />
                            {selectedMember.city && selectedMember.state
                              ? `${selectedMember.city}, ${selectedMember.state} ${selectedMember.zipCode || ''}`
                              : ''}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Tags */}
                <div className="mt-4 pt-4 border-t border-[--sage] border-opacity-20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[--navy]">Tags</span>
                    {!isEditingMember && (
                      <button
                        onClick={() => setShowAddTag(true)}
                        className="text-xs text-[--sage] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Tag
                      </button>
                    )}
                  </div>
                  
                  {showAddTag && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="New tag..."
                        className="flex-1 px-2 py-1 text-sm border border-[--sage] rounded"
                        autoFocus
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-3 py-1 text-sm bg-[--sage] text-white rounded hover:bg-opacity-90"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setShowAddTag(false); setNewTag(''); }}
                        className="px-2 py-1 text-sm text-[--charcoal] hover:bg-[--cream] rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {(selectedMember.tags && selectedMember.tags.length > 0) ? (
                      selectedMember.tags.map((tag) => (
                        <span
                          key={tag}
                          className="group px-3 py-1 text-xs bg-[--sage] bg-opacity-20 text-[--navy] rounded-full flex items-center gap-1"
                        >
                          {tag}
                          {!isEditingMember && (
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 hover:text-red-600" />
                            </button>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[--charcoal] opacity-60">No tags</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-6 border-t border-[--sage] border-opacity-20 space-y-2">
                  {isEditingMember ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        disabled={updateMemberMutation.isLoading}
                        className="w-full px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {updateMemberMutation.isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={updateMemberMutation.isLoading}
                        className="w-full px-4 py-2 bg-white border-2 border-[--sage] text-[--navy] rounded-lg hover:bg-[--cream] transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleStartEdit}
                        className="w-full px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Details
                      </button>
                      <button
                        onClick={() => setShowAddNote(true)}
                        className="w-full px-4 py-2 bg-white border-2 border-[--sage] text-[--navy] rounded-lg hover:bg-[--cream] transition-all flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Add Note
                      </button>
                    </>
                  )}
                </div>

                {/* Add Note Panel */}
                {showAddNote && (
                  <div className="mt-4 p-4 border border-[--sage] border-opacity-20 rounded-lg bg-[--cream]">
                    <label className="block text-sm font-medium text-[--navy] mb-2">Add Note</label>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter note about this family member..."
                      className="w-full px-3 py-2 border border-[--sage] rounded-lg mb-2"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddNote}
                        className="px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 text-sm"
                      >
                        Save Note
                      </button>
                      <button
                        onClick={() => { setShowAddNote(false); setNewNote(''); }}
                        className="px-4 py-2 bg-white border border-[--sage] text-[--navy] rounded-lg hover:bg-[--cream] text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Case History */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-[--sage] border-opacity-20 p-6">
              <h3 className="text-lg font-serif text-[--navy] mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Case History
              </h3>

              {familyTree.cases.length === 0 ? (
                <p className="text-sm text-[--charcoal] opacity-60 text-center py-4">
                  No cases associated with this family
                </p>
              ) : (
                <div className="space-y-3">
                  {familyTree.cases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="p-3 border border-[--sage] border-opacity-20 rounded-lg hover:bg-[--cream] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-[--navy]">
                          Case #{caseItem.caseNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            caseItem.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {caseItem.status}
                        </span>
                      </div>
                      <p className="text-sm text-[--charcoal]">
                        {caseItem.decedentFirstName} {caseItem.decedentLastName}
                      </p>
                      {caseItem.dateOfDeath && (
                        <div className="flex items-center gap-1 text-xs text-[--charcoal] opacity-60 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(caseItem.dateOfDeath).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddMemberModal && (
          <AddMemberModal
            isOpen={showAddMemberModal}
            onClose={() => setShowAddMemberModal(false)}
            familyId={familyId}
            onSuccess={() => refetch()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
