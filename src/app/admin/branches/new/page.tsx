import NewBranchForm from "./new-branch-form";

export default function NewBranchPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Add New Branch
        </h1>

        <p className="mt-2 text-gray-600">
          Add a Regime Energy Services branch location.
        </p>
      </div>

      <NewBranchForm />
    </div>
  );
}