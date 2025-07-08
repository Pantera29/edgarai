export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('🔔 Cron job started');
  console.log('Headers:', JSON.stringify(Object.fromEntries(request.headers)));
  return new Response('Cron test OK', { status: 200 });
} 