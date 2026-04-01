type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
};

export default function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={
        "inline-flex items-center justify-center rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.2)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300 " +
        className
      }
    >
      {children}
    </button>
  );
}
