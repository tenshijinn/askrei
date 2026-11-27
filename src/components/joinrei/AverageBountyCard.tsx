import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BOUNTY_AVERAGE_WINDOW, averageBountyUsd, formatAverageUsd } from '@/lib/bountyAverage';

const useAverageBounty = () =>
  useQuery({
    queryKey: ['average-bounty', BOUNTY_AVERAGE_WINDOW],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_public_tasks')
        .select('compensation, created_at')
        .order('created_at', { ascending: false })
        .limit(BOUNTY_AVERAGE_WINDOW);
      if (error) throw error;
      return averageBountyUsd((data ?? []).map((r) => r.compensation));
    },
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 60 * 1000,
  });

export const AverageBountyCard = () => {
  const { data } = useAverageBounty();
  const hasAverage = data?.average != null;

  return (
    <div className="rounded-xl border-[0.5px] border-white/10 bg-[#141414]/60 backdrop-blur-sm px-5 py-3 min-w-0 lg:min-w-[180px] flex flex-col justify-between">
      <div>
        <p className="text-[10px] font-mono text-white/40 tracking-wider mb-1 flex items-center gap-1.5">
          Average Bounty
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#ed565a] animate-pulse" aria-hidden="true" />
        </p>
        <p className="text-2xl font-light text-white/70 tabular-nums whitespace-nowrap">
          {hasAverage ? formatAverageUsd(data.average) : '—'}
        </p>
      </div>
      <p className="text-[10px] font-mono text-white/30 mt-2">
        {hasAverage ? `last ${data.total} bounties` : ''}
      </p>
    </div>
  );
};
