type InputFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  onChange: (value: string) => void;
};

export default function InputField({
  label,
  value,
  placeholder = "",
  required = false,
  type = "text",
  onChange,
}: InputFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
      />
    </label>
  );
}
