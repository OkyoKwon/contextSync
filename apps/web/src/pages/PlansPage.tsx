import { useState, useMemo } from 'react';
import { showToast } from '../lib/toast';
import { usePlans, usePlanDetail, useDeletePlan } from '../hooks/use-plans';
import { PlanList } from '../components/plans/PlanList';
import { PlanViewer } from '../components/plans/PlanViewer';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { PlansIcon } from '../components/layout/sidebar-icons';
import { useAuthStore } from '../stores/auth.store';

export function PlansPage() {
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const currentProjectId = useAuthStore((s) => s.currentProjectId);
  const { data: plansData, isLoading } = usePlans();
  const { data: planDetailData } = usePlanDetail(selectedFilename);
  const deleteMutation = useDeletePlan();

  const planDetail = planDetailData?.data ?? null;

  const plans = useMemo(() => {
    const allPlans = plansData?.data ?? [];
    return currentProjectId
      ? allPlans.filter((p) => p.projects.some((proj) => proj.projectId === currentProjectId))
      : allPlans;
  }, [plansData?.data, currentProjectId]);

  const handleDelete = (filename: string) => {
    deleteMutation.mutate(filename, {
      onSuccess: () => {
        showToast.success('Plan deleted');
        setSelectedFilename(null);
      },
      onError: (err) => showToast.error(err.message),
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      <div
        className={`w-full border-b border-border-default md:w-80 md:flex-shrink-0 md:border-b-0 md:border-r ${selectedFilename ? 'hidden md:block' : ''}`}
      >
        <PlanList
          plans={plans}
          selectedFilename={selectedFilename}
          onSelect={setSelectedFilename}
        />
      </div>
      <div className={`flex-1 ${!selectedFilename ? 'hidden md:block' : ''}`}>
        {planDetail ? (
          <div>
            <button
              type="button"
              onClick={() => setSelectedFilename(null)}
              className="flex items-center gap-1 px-4 pt-3 text-sm text-link hover:text-link-hover md:hidden"
            >
              &larr; Back to list
            </button>
            <PlanViewer
              plan={planDetail}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          </div>
        ) : (
          <EmptyState
            icon={<PlansIcon />}
            title="Select a plan to view"
            description={`${plans.length} plan${plans.length !== 1 ? 's' : ''} available`}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}
