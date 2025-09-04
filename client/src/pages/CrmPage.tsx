import React, { useState, useEffect } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent, DragOverlay, type DragStartEvent
} from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';

// --- Type Definitions ---
interface Lead {
  id: string;
  title: string;
  expectedRevenue: number;
  probability: number;
  stageId: string;
}
interface PipelineStage {
  id: string;
  name: string;
  leads: Lead[];
}

interface CrmPageProps {
    navigateTo: (page: 'crm' | 'customers') => void;
}

const CrmPage = ({ navigateTo }: CrmPageProps) => {
    const { token } = useAuth();
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [activeLead, setActiveLead] = useState<Lead | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
    const apiHeaders = { 'Content-Type': 'application/json', 'x-auth-token': token || '' };

    const fetchPipelineData = async () => {
        if (!token) return;
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('/api/pipelines/stages', { headers: apiHeaders });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setStages(data);
        } catch (e: any) {
            setError(`Failed to fetch data: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPipelineData(); }, [token]);

    const findStageOfLead = (leadId: string) => stages.find(stage => stage.leads.some(lead => lead.id === leadId));

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const lead = stages.flatMap(s => s.leads).find(l => l.id === active.id);
        if (lead) setActiveLead(lead);
    };

    // --- THIS IS THE CORRECTED FUNCTION ---
    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveLead(null);
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        const activeStage = findStageOfLead(activeId);
        const overStage = stages.find(stage => stage.id === overId) || findStageOfLead(overId);

        if (!activeStage || !overStage) return;

        // CASE 1: Reordering within the same stage
        if (activeStage.id === overStage.id) {
            if (activeId === overId) return; // Dropped in the same place

            setStages(prevStages => {
                const currentStage = prevStages.find(s => s.id === activeStage.id);
                if (!currentStage) return prevStages;
                
                const oldIndex = currentStage.leads.findIndex(l => l.id === activeId);
                const newIndex = currentStage.leads.findIndex(l => l.id === overId);

                const reorderedLeads = arrayMove(currentStage.leads, oldIndex, newIndex);
                
                return prevStages.map(s => s.id === currentStage.id ? { ...s, leads: reorderedLeads } : s);
            });
            return;
        }

        // CASE 2: Moving to a different stage
        const originalStages = JSON.parse(JSON.stringify(stages)); // Deep copy for rollback
        const leadToMove = activeStage.leads.find(l => l.id === activeId);
        if (!leadToMove) return;

        // Optimistic UI Update
        setStages(prevStages => {
            // Remove from old stage
            const activeStageLeads = prevStages.find(s => s.id === activeStage.id)!.leads.filter(l => l.id !== activeId);
            
            // Add to new stage
            const overStageLeads = prevStages.find(s => s.id === overStage.id)!.leads;
            let overIndex = overStageLeads.findIndex(l => l.id === overId);
            if (overIndex === -1) {
                overIndex = overStageLeads.length;
            }
            
            const newOverStageLeads = [...overStageLeads];
            newOverStageLeads.splice(overIndex, 0, { ...leadToMove, stageId: overStage.id });

            // Create a new array for the state
            return prevStages.map(s => {
                if (s.id === activeStage.id) return { ...s, leads: activeStageLeads };
                if (s.id === overStage.id) return { ...s, leads: newOverStageLeads };
                return s;
            });
        });

        // API Call
        try {
            const response = await fetch(`/api/leads/${activeId}/move`, {
                method: 'PATCH',
                headers: apiHeaders,
                body: JSON.stringify({ newStageId: overStage.id })
            });
            if (!response.ok) throw new Error('Failed to update server.');
        } catch (err) {
            setStages(originalStages);
            alert("Could not move lead.");
        }
    };
    
    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <AppHeader 
                currentPage="crm" 
                navigateTo={navigateTo}
                openCreateLeadModal={() => setCreateModalOpen(true)}
            />
            <main className="p-4">
                {isLoading && <p>Loading...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!isLoading && !error && (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex overflow-x-auto space-x-4 pb-4">
                            {stages.map((stage) => <PipelineColumn key={stage.id} stage={stage} onCardClick={setSelectedLead} />)}
                        </div>
                        <DragOverlay>{activeLead ? <LeadCard lead={activeLead} isOverlay={true} /> : null}</DragOverlay>
                    </DndContext>
                )}
            </main>
            {isCreateModalOpen && <CreateLeadModal closeModal={() => setCreateModalOpen(false)} onLeadCreated={fetchPipelineData} />}
            {selectedLead && <LeadDetailModal lead={selectedLead} closeModal={() => setSelectedLead(null)} onDataChange={fetchPipelineData} />}
        </div>
    );
};

// --- ALL COMPONENTS BELOW THIS LINE ARE UNCHANGED ---

const PipelineColumn = ({ stage, onCardClick }: { stage: PipelineStage, onCardClick: (lead: Lead) => void }) => (
    <div className="bg-gray-200 rounded-lg p-3 w-80 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700">{stage.name}</h2>
            <span className="bg-gray-300 text-gray-600 text-sm font-bold px-2 py-1 rounded-full">{stage.leads.length}</span>
        </div>
        <SortableContext id={stage.id} items={stage.leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3 min-h-[200px]">
                {stage.leads.map((lead) => <SortableLeadCard key={lead.id} lead={lead} onCardClick={onCardClick} />)}
            </div>
        </SortableContext>
    </div>
);

const SortableLeadCard = ({ lead, onCardClick }: { lead: Lead, onCardClick: (lead: Lead) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return <LeadCard ref={setNodeRef} style={style} lead={lead} attributes={attributes} listeners={listeners} onCardClick={onCardClick} />;
};

const LeadCard = React.forwardRef<HTMLDivElement, {lead: Lead, isOverlay?: boolean, style?: React.CSSProperties, attributes?: any, listeners?: any, onCardClick?: (lead: Lead) => void}>(
    ({lead, isOverlay = false, style, attributes, listeners, onCardClick}, ref) => {
    const cardClasses = `bg-white rounded-md shadow p-4 ${isOverlay ? 'shadow-xl' : 'hover:shadow-lg'} transition-shadow ${!isOverlay ? 'cursor-grab' : ''}`;
    
    return (
        <div ref={ref} style={style} className={cardClasses} {...attributes} {...listeners} onClick={() => onCardClick && onCardClick(lead)}>
            <h3 className="font-bold text-gray-900">{lead.title}</h3>
            <p className="text-sm text-gray-600 mt-1">Revenue: ${lead.expectedRevenue.toLocaleString()}</p>
            <div className="mt-3"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${lead.probability}%` }}></div></div><p className="text-xs text-right text-gray-500 mt-1">{lead.probability}%</p></div>
        </div>
    );
});

const CreateLeadModal = ({ closeModal, onLeadCreated }: { closeModal: () => void; onLeadCreated: () => void; }) => {
    const { token } = useAuth();
    const [title, setTitle] = useState('');
    const [expectedRevenue, setExpectedRevenue] = useState('');
    const [probability, setProbability] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                body: JSON.stringify({ title, expectedRevenue: Number(expectedRevenue), probability: Number(probability) })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Failed to create lead');
            onLeadCreated();
            closeModal();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Create New Lead</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    <input type="text" placeholder="Lead Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
                    <input type="number" placeholder="Expected Revenue ($)" value={expectedRevenue} onChange={e => setExpectedRevenue(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
                    <input type="number" placeholder="Probability (%)" value={probability} onChange={e => setProbability(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
                    <div className="flex justify-end space-x-2">
                         <button type="button" onClick={closeModal} className="bg-gray-200 py-2 px-4 rounded-lg">Cancel</button>
                         <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg">Save Lead</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LeadDetailModal = ({ lead, closeModal, onDataChange }: { lead: Lead; closeModal: () => void; onDataChange: () => void; }) => {
    const { token } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...lead });
    const [error, setError] = useState('');

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`/api/leads/${lead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update lead');
            onDataChange();
            closeModal();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this lead?")) return;
        setError('');
        try {
            const response = await fetch(`/api/leads/${lead.id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token || '' }
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete lead');
            }
            onDataChange();
            closeModal();
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{isEditing ? 'Edit Lead' : 'Lead Details'}</h2>
                    {!isEditing && <button onClick={() => setIsEditing(true)} className="text-sm text-blue-600">Edit</button>}
                </div>

                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                {isEditing ? (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
                        <input type="number" value={formData.expectedRevenue} onChange={e => setFormData({...formData, expectedRevenue: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" required />
                        <input type="number" value={formData.probability} onChange={e => setFormData({...formData, probability: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" required />
                        <div className="flex justify-between items-center">
                             <button type="button" onClick={handleDelete} className="bg-red-500 text-white py-2 px-4 rounded-lg">Delete</button>
                            <div>
                                <button type="button" onClick={() => {setIsEditing(false); setFormData({...lead})}} className="bg-gray-200 py-2 px-4 rounded-lg mr-2">Cancel</button>
                                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg">Save</button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <p><strong>Title:</strong> {lead.title}</p>
                        <p><strong>Expected Revenue:</strong> ${lead.expectedRevenue.toLocaleString()}</p>
                        <p><strong>Probability:</strong> {lead.probability}%</p>
                        <div className="text-right">
                            <button onClick={closeModal} className="bg-gray-200 py-2 px-4 rounded-lg">Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CrmPage;