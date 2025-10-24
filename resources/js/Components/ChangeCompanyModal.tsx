import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";

interface Company {
  id: number;
  name: string;
}

interface ChangeCompanyModalProps {
  companies: Company[];
  currentCompanyId: number;
  onClose: () => void;
}

export default function ChangeCompanyModal({ companies, currentCompanyId, onClose }: ChangeCompanyModalProps) {
  const [selectedCompany, setSelectedCompany] = useState<number>(currentCompanyId);
  const { errors } = usePage().props as any;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post("/usercompany/change", { company_id: selectedCompany }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Change Current Company</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
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
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white rounded-md px-4 py-2 mr-2 hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white rounded-md px-4 py-2 hover:bg-indigo-700 transition"
            >
              Change Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
