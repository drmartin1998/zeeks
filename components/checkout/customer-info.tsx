interface CustomerInfoProps {
  name: string;
  email: string;
}

export function CustomerInfo({ name, email }: CustomerInfoProps) {
  return (
    <div className="rounded-2xl border border-[#CDCDD8] bg-white p-8">
      <h3 className="text-[15px] font-bold text-text-primary">Contact Information</h3>
      <div className="mt-3 space-y-1 text-sm">
        <p className="text-text-primary">{name}</p>
        <p className="text-text-muted">{email}</p>
      </div>
    </div>
  );
}
