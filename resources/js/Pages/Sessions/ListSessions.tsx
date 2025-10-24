import React from 'react';
import { PageProps } from '@inertiajs/inertia';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Session {
  id: string;
  user_id: string | null;
  user_name?: string | null;
  company_name?: string | null;
  ip_address: string | null;
  user_agent: string | null;
  payload: string;
  last_activity: number;
}

interface Props extends PageProps {
  sessions: Session[];
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString();
}

export default function ListSessions({ sessions }: Props) {
  return (
    <AuthenticatedLayout header="Active Sessions">
      <div className="mx-5">
          <div className="relative overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full w-full text-sm text-left text-gray-700 rounded-lg overflow-hidden">
            <thead className="text-xs uppercase bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Session ID</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">User</th>
                <th className="px-6 py-3 font-semibold">Company</th>
                <th className="px-6 py-3 font-semibold">IP Address</th>
                <th className="px-6 py-3 font-semibold">User Agent</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length > 0 ? (
                sessions.map(session => (
                  <tr key={session.id} className="border-b hover:bg-blue-50 transition">
                    <td className="px-6 py-4 text-xs break-all font-medium text-gray-900">{session.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{session.user_name || session.user_id || '-'}</td>
                    <td className="px-6 py-4">{session.company_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {session.ip_address || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">{session.user_agent || '-'}</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDate(session.last_activity)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No active sessions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
