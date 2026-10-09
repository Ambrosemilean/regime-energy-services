import NewServiceForm from "./new-service-form";

export default function NewServicePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Add New Service
        </h1>

        <p className="mt-2 text-gray-600">
          Create a new service for Regime Energy Services.
        </p>
      </div>

      <NewServiceForm />
    </div>
  );
}