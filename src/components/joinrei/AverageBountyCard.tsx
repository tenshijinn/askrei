import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BOUNTY_AVERAGE_WINDOW, averageBountyUsd, formatAverageUsd, highestBountyUsd } from '@/lib/bountyAverage';

const useAverageBounty = () =>
  useQuery({
    queryKey: ['average-bounty', BOUNTY_AVERAGE_WINDOW, 'highest-30d'],
    queryFn: async () => {
      const compensations: Array<string | null> = [];
      const pageSize = 500;
      // This view already restricts the feed to the last 30 days.
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase
          .from('v_public_tasks')
          .select('compensation, created_at, id')
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        const rows = data ?? [];
        compensations.push(...rows.map((row) => row.compensation));
        if (rows.length < pageSize) break;
      }
      return { ...averageBountyUsd(compensations), highest30d: highestBountyUsd(compensations) };
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
        {data?.highest30d != null ? (
          <>
            Highest 30d bounty:{' '}
            <strong className="font-bold text-foreground/50">{formatAverageUsd(data.highest30d)}</strong>
          </>
        ) : null}
      </p>
    </div>
  );
};
