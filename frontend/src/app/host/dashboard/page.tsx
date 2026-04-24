import dynamic from 'next/dynamic';
const HostDashboard = dynamic(() => import('./host-dashboard-page'), {
    loading: () => (<div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif',
            background: '#fff',
            color: '#64748b',
            fontSize: 14,
        }}>
      Loading dashboard…
    </div>),
});
type PageProps = {
    params?: Promise<Record<string, string | string[] | undefined>>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};
export default function HostDashboardPage(props: PageProps) {
    return <HostDashboard {...props}/>;
}
