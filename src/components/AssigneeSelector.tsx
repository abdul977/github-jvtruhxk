import React, { useEffect, useState } from 'react';
import { useTeamStore } from '../store/teamStore';
import { useAssigneeStore } from '../store/assigneeStore';
import { User, AlertCircle } from 'lucide-react';

interface AssigneeSelectorProps {
  teamId: string;
  value: string;
  onChange: (userId: string) => void;
}

export default function AssigneeSelector({ teamId, value, onChange }: AssigneeSelectorProps) {
  const { members, fetchTeamMembers } = useTeamStore();
  const { fetchWorkload } = useAssigneeStore();
  const [workloads, setWorkloads] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchTeamMembers(teamId);
  }, [teamId, fetchTeamMembers]);

  useEffect(() => {
    const loadWorkloads = async () => {
      const loadedWorkloads: Record<string, any> = {};
      for (const member of members) {
        await fetchWorkload(member.user_id);
        const { data } = await supabase
          .from('workload_tracking')
          .select('*')
          .eq('user_id', member.user_id)
          .single();
        loadedWorkloads[member.user_id] = data;
      }
      setWorkloads(loadedWorkloads);
    };
    
    if (members.length > 0) {
      loadWorkloads();
    }
  }, [members, fetchWorkload]);

  const getWorkloadColor = (taskCount: number) => {
    if (taskCount >= 8) return 'text-red-600';
    if (taskCount >= 5) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Assignee
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Unassigned</option>
          {members.map((member) => {
            const workload = workloads[member.user_id];
            return (
              <option key={member.user_id} value={member.user_id}>
                {member.user_id} 
                {workload && ` (${workload.task_count} tasks)`}
              </option>
            );
          })}
        </select>
      </div>
      
      {value && workloads[value] && workloads[value].task_count >= 5 && (
        <div className="flex items-center mt-2 text-sm text-orange-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          High workload warning
        </div>
      )}
    </div>
  );
}