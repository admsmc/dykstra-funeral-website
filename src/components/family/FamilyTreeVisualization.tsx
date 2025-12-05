'use client';

import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Heart,
  Baby,
  User,
  Crown,
  X,
} from 'lucide-react';

/**
 * Family Tree Visualization Component
 * 
 * Interactive graph visualization of family relationships using React Flow.
 * 
 * **Features:**
 * - Interactive family tree with zoom/pan controls
 * - Click member to see details
 * - Add member inline
 * - Add relationship with drag-and-drop
 * - Highlight decedent
 * - Show multiple generations
 * - Export as PDF/image
 * 
 * **Architecture Compliance:**
 * - Client component (uses 'use client')
 * - Delegates data fetching to tRPC
 * - Pure UI rendering logic
 */

/**
 * ═══════════════════════════════════════════════════════
 * TYPE DEFINITIONS
 * ═══════════════════════════════════════════════════════
 */

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  type: 'primary' | 'secondary' | 'professional' | 'referral';
  tags: string[];
}

export interface FamilyRelationship {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  type: string;
  inverseType: string;
  isPrimaryContact: boolean;
  decedentId?: string | null;
  notes?: string | null;
}

export interface FamilyCase {
  id: string;
  caseNumber: string;
  decedentFirstName: string;
  decedentLastName: string;
  status: string;
  dateOfDeath?: Date | null;
}

export interface FamilyTree {
  familyId: string;
  members: FamilyMember[];
  relationships: FamilyRelationship[];
  cases: FamilyCase[];
}

interface FamilyTreeVisualizationProps {
  familyTree: FamilyTree;
  onMemberClick?: (member: FamilyMember) => void;
  onAddMember?: () => void;
  onAddRelationship?: (fromId: string, toId: string) => void;
  onExportPDF?: () => void;
  onExportImage?: () => void;
}

/**
 * ═══════════════════════════════════════════════════════
 * LAYOUT ALGORITHM
 * ═══════════════════════════════════════════════════════
 */

/**
 * Calculate hierarchical layout positions for family members
 * Uses a generation-based approach with horizontal spacing
 */
function calculateFamilyTreeLayout(
  members: FamilyMember[],
  relationships: FamilyRelationship[],
  cases: FamilyCase[]
): { nodes: Node[]; edges: Edge[] } {
  // Find decedents (members with associated cases)
  const decedentIds = new Set(cases.map((c) => c.id));

  // Build adjacency list for relationships
  const relationshipMap = new Map<string, FamilyRelationship[]>();
  relationships.forEach((rel) => {
    if (!relationshipMap.has(rel.fromMemberId)) {
      relationshipMap.set(rel.fromMemberId, []);
    }
    relationshipMap.get(rel.fromMemberId)!.push(rel);
  });

  // Calculate generations (depth from root)
  const generations = new Map<string, number>();
  const visited = new Set<string>();

  function calculateGeneration(memberId: string, depth: number = 0) {
    if (visited.has(memberId)) return;
    visited.add(memberId);
    generations.set(memberId, depth);

    const rels = relationshipMap.get(memberId) || [];
    rels.forEach((rel) => {
      // Children go down, parents stay same level
      if (rel.type === 'child') {
        calculateGeneration(rel.toMemberId, depth + 1);
      }
    });
  }

  // Start from primary contacts or first member
  const primaryMember = members.find((m) => m.type === 'primary') || members[0];
  if (primaryMember) {
    calculateGeneration(primaryMember.id, 0);
  }

  // Group members by generation
  const generationGroups = new Map<number, string[]>();
  generations.forEach((gen, memberId) => {
    if (!generationGroups.has(gen)) {
      generationGroups.set(gen, []);
    }
    generationGroups.get(gen)!.push(memberId);
  });

  // Calculate positions
  const HORIZONTAL_SPACING = 250;
  const VERTICAL_SPACING = 150;
  const nodes: Node[] = [];

  members.forEach((member) => {
    const generation = generations.get(member.id) || 0;
    const generationMembers = generationGroups.get(generation) || [];
    const indexInGeneration = generationMembers.indexOf(member.id);

    const isDecedent = decedentIds.has(member.id);
    const isPrimary = member.type === 'primary';

    nodes.push({
      id: member.id,
      type: 'custom',
      data: {
        member,
        isDecedent,
        isPrimary,
      },
      position: {
        x: indexInGeneration * HORIZONTAL_SPACING,
        y: generation * VERTICAL_SPACING,
      },
    });
  });

  // Create edges from relationships
  const edges: Edge[] = relationships.map((rel) => ({
    id: rel.id,
    source: rel.fromMemberId,
    target: rel.toMemberId,
    label: rel.type,
    type: 'smoothstep',
    animated: rel.isPrimaryContact,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
    },
    style: {
      strokeWidth: 2,
      stroke: rel.isPrimaryContact ? '#b8956a' : '#8b9d83',
    },
  }));

  return { nodes, edges };
}

/**
 * ═══════════════════════════════════════════════════════
 * CUSTOM NODE COMPONENT
 * ═══════════════════════════════════════════════════════
 */

function FamilyMemberNode({ data }: { data: any }) {
  const { member, isDecedent, isPrimary } = data;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        px-4 py-3 rounded-lg shadow-md border-2 cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:scale-105
        ${
          isDecedent
            ? 'bg-[--navy] border-[--gold] text-white'
            : isPrimary
            ? 'bg-[--sage] border-[--navy] text-white'
            : 'bg-white border-[--sage] text-[--navy]'
        }
      `}
      style={{ minWidth: '180px' }}
    >
      <div className="flex items-center gap-2 mb-1">
        {isDecedent && <Crown className="w-4 h-4 text-[--gold]" />}
        {isPrimary && !isDecedent && <Heart className="w-4 h-4" />}
        <span className="font-semibold text-sm">
          {member.firstName} {member.lastName}
        </span>
      </div>

      {member.email && (
        <div className="text-xs opacity-80 truncate">{member.email}</div>
      )}

      {member.phone && (
        <div className="text-xs opacity-80">{member.phone}</div>
      )}

      {member.tags && member.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {member.tags.slice(0, 2).map((tag: string) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white bg-opacity-20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const nodeTypes = {
  custom: FamilyMemberNode,
};

/**
 * ═══════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ═══════════════════════════════════════════════════════
 */

function FamilyTreeVisualizationInner({
  familyTree,
  onMemberClick,
  onAddMember,
  onAddRelationship,
  onExportPDF,
  onExportImage,
}: FamilyTreeVisualizationProps) {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  // Calculate layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () =>
      calculateFamilyTreeLayout(
        familyTree.members,
        familyTree.relationships,
        familyTree.cases
      ),
    [familyTree]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && onAddRelationship) {
        onAddRelationship(connection.source, connection.target);
      }
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges, onAddRelationship]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const member = node.data.member as FamilyMember;
      setSelectedMember(member);
      if (onMemberClick) {
        onMemberClick(member);
      }
    },
    [onMemberClick]
  );

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={2}
      >
        <Controls className="bg-white shadow-lg rounded-lg" />
        <MiniMap
          className="bg-white shadow-lg rounded-lg"
          nodeColor={(node) => {
            if (node.data.isDecedent) return '#1e3a5f';
            if (node.data.isPrimary) return '#8b9d83';
            return '#f5f3ed';
          }}
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

        {/* Action Panel */}
        <Panel position="top-right" className="flex flex-col gap-2">
          <button
            onClick={onAddMember}
            className="flex items-center gap-2 px-4 py-2 bg-[--sage] text-white rounded-lg shadow-lg hover:bg-opacity-90 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>

          <button
            onClick={onExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg shadow-lg hover:bg-opacity-90 transition-all"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>

          <button
            onClick={onExportImage}
            className="flex items-center gap-2 px-4 py-2 bg-[--navy] text-white rounded-lg shadow-lg hover:bg-opacity-90 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Image
          </button>

          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[--sage] text-[--navy] rounded-lg shadow-lg hover:bg-[--cream] transition-all"
          >
            <Users className="w-4 h-4" />
            Legend
          </button>
        </Panel>

        {/* Legend Panel */}
        <AnimatePresence>
          {showLegend && (
            <Panel position="top-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-4 rounded-lg shadow-lg border-2 border-[--sage]"
              >
                <h3 className="font-semibold text-[--navy] mb-3">Legend</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[--navy] rounded border-2 border-[--gold]"></div>
                    <span>Decedent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[--sage] rounded border-2 border-[--navy]"></div>
                    <span>Primary Contact</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white rounded border-2 border-[--sage]"></div>
                    <span>Family Member</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[--sage] border-opacity-20">
                    <div className="w-12 h-0.5 bg-[--gold]"></div>
                    <span className="text-xs">Primary Contact Link</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-0.5 bg-[--sage]"></div>
                    <span className="text-xs">Family Relationship</span>
                  </div>
                </div>
              </motion.div>
            </Panel>
          )}
        </AnimatePresence>
      </ReactFlow>

      {/* Member Details Sidebar */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 w-80 h-full bg-white shadow-2xl border-l-4 border-[--sage] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-serif text-[--navy] mb-1">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h2>
                  <span className="text-sm text-[--charcoal] opacity-60 capitalize">
                    {selectedMember.type}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-2 hover:bg-[--cream] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[--charcoal]" />
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                {selectedMember.email && (
                  <div>
                    <div className="text-xs text-[--charcoal] opacity-60 mb-1">Email</div>
                    <div className="text-sm text-[--navy]">{selectedMember.email}</div>
                  </div>
                )}

                {selectedMember.phone && (
                  <div>
                    <div className="text-xs text-[--charcoal] opacity-60 mb-1">Phone</div>
                    <div className="text-sm text-[--navy]">{selectedMember.phone}</div>
                  </div>
                )}

                {selectedMember.address && (
                  <div>
                    <div className="text-xs text-[--charcoal] opacity-60 mb-1">Address</div>
                    <div className="text-sm text-[--navy]">
                      {selectedMember.address}
                      <br />
                      {selectedMember.city && selectedMember.state
                        ? `${selectedMember.city}, ${selectedMember.state} ${selectedMember.zipCode || ''}`
                        : ''}
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {selectedMember.tags && selectedMember.tags.length > 0 && (
                <div>
                  <div className="text-xs text-[--charcoal] opacity-60 mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs bg-[--sage] bg-opacity-20 text-[--navy] rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationships */}
              <div className="mt-6 pt-6 border-t border-[--sage] border-opacity-20">
                <h3 className="text-sm font-semibold text-[--navy] mb-3">Relationships</h3>
                <div className="space-y-2">
                  {familyTree.relationships
                    .filter(
                      (rel) =>
                        rel.fromMemberId === selectedMember.id ||
                        rel.toMemberId === selectedMember.id
                    )
                    .map((rel) => {
                      const otherMemberId =
                        rel.fromMemberId === selectedMember.id
                          ? rel.toMemberId
                          : rel.fromMemberId;
                      const otherMember = familyTree.members.find(
                        (m) => m.id === otherMemberId
                      );
                      const relationshipType =
                        rel.fromMemberId === selectedMember.id ? rel.type : rel.inverseType;

                      if (!otherMember) return null;

                      return (
                        <div
                          key={rel.id}
                          className="flex items-center gap-2 text-sm p-2 hover:bg-[--cream] rounded transition-colors cursor-pointer"
                          onClick={() => setSelectedMember(otherMember)}
                        >
                          <User className="w-4 h-4 text-[--sage]" />
                          <span className="text-[--charcoal] opacity-60 capitalize">
                            {relationshipType}:
                          </span>
                          <span className="text-[--navy] font-medium">
                            {otherMember.firstName} {otherMember.lastName}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-[--sage] border-opacity-20 space-y-2">
                <button className="w-full px-4 py-2 bg-[--sage] text-white rounded-lg hover:bg-opacity-90 transition-all">
                  Edit Details
                </button>
                <button className="w-full px-4 py-2 bg-white border-2 border-[--sage] text-[--navy] rounded-lg hover:bg-[--cream] transition-all">
                  Add Note
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Footer */}
      <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg border-2 border-[--sage] border-opacity-20">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-[--charcoal] opacity-60">Members:</span>
            <span className="ml-2 font-semibold text-[--navy]">
              {familyTree.members.length}
            </span>
          </div>
          <div>
            <span className="text-[--charcoal] opacity-60">Relationships:</span>
            <span className="ml-2 font-semibold text-[--navy]">
              {familyTree.relationships.length}
            </span>
          </div>
          <div>
            <span className="text-[--charcoal] opacity-60">Cases:</span>
            <span className="ml-2 font-semibold text-[--navy]">
              {familyTree.cases.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper with ReactFlowProvider
 */
export default function FamilyTreeVisualization(props: FamilyTreeVisualizationProps) {
  return (
    <ReactFlowProvider>
      <FamilyTreeVisualizationInner {...props} />
    </ReactFlowProvider>
  );
}
