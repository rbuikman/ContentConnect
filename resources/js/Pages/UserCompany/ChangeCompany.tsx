import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";

interface Company {
  id: number;
  name: string;
}

interface ChangeCompanyProps {
  companies: Company[];
  currentCompanyId: number;
}

export default function ChangeCompany({ companies, currentCompanyId }: ChangeCompanyProps) {
  const [selectedCompany, setSelectedCompany] = useState<number>(currentCompanyId);
  const { errors } = usePage().props as any;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post("/usercompany/change", { company_id: selectedCompany });
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-8 mt-8">
      <h2 className="text-xl font-semibold mb-6">Change Current Company</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
            Select Company
          </label>
          <select
            id="company_id"
            name="company_id"
            value={selectedCompany}
            onChange={e => setSelectedCompany(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          {errors.company_id && <div className="text-red-500 text-sm mt-1">{errors.company_id}</div>}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-md px-4 py-2 hover:bg-indigo-700 transition"
          >
            Change Company
          </button>
        </div>
      </form>
    </div>
  );
}
