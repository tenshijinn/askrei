UPDATE public.tasks
SET link = REPLACE(link, 'earn.superteam.fun/listings/', 'earn.superteam.fun/listing/')
WHERE link ILIKE 'https://earn.superteam.fun/listings/%';