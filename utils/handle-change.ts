export function handleChange<T>(data: T, onChange: (updated: T) => void) {
  return (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };
}
