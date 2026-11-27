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
        <p className="text-[10px] font-mono text-white/40 tracking-wider mb-1">Average Bounty Size</p>
        <p className="text-2xl font-light text-white/70 tabular-nums whitespace-nowrap">
          {hasAverage ? formatAverageUsd(data.average) : '—'}
        </p>
      </div>
      <p className="text-[10px] font-mono text-white/30 mt-2 leading-snug lg:max-w-[210px]">
        {hasAverage ? (
          <>
            Last {data.priced} Bounties Range{' '}
            <strong className="font-bold text-white/50">{formatAverageUsd(data.highest)}</strong> to{' '}
            <strong className="font-bold text-white/50">{formatAverageUsd(data.lowest)}</strong>
          </>
        ) : null}
      </p>
    </div>
  );
};
