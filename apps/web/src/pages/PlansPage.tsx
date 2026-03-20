import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { usePlans, usePlanDetail, useDeletePlan } from '../hooks/use-plans';
import { PlanList } from '../components/plans/PlanList';
import { PlanViewer } from '../components/plans/PlanViewer';
import { useAuthStore } from '../stores/auth.store';

export function PlansPage() {
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const { data: plansData, isLoading } = usePlans();
  const { data: planDetailData } = usePlanDetail(selectedFilename);
  const deleteMutation = useDeletePlan();

  const allPlans = plansData?.data ?? [];
  const planDetail = planDetailData?.data ?? null;

  const plans = useMemo(
    () =>
      currentProjectId
        ? allPlans.filter((p) => p.projects.some((proj) => proj.projectId === currentProjectId))
        : allPlans,
    [allPlans, currentProjectId],
  );

  const handleDelete = (filename: string) => {
    deleteMutation.mutate(filename, {
      onSuccess: () => {
        toast.success('Plan deleted');
        setSelectedFilename(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0 border-r border-border-default">
        <PlanList
          plans={plans}
          selectedFilename={selectedFilename}
          onSelect={setSelectedFilename}
        />
      </div>
      <div className="flex-1">
        {planDetail ? (
          <PlanViewer
            plan={planDetail}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-text-tertiary">
            <svg
              className="mb-3 h-12 w-12 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">Select a plan to view</p>
            <p className="mt-1 text-xs">
              {plans.length} plan{plans.length !== 1 ? 's' : ''} available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
