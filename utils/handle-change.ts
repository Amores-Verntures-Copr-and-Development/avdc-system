export function handleChange<T>(data: T, onChange: (updated: T) => void) {
  return (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };
}

export function handleArrayItemChange<T extends { [key: string]: any }>(
  idKey: keyof T,
  list: T[],
  setList: React.Dispatch<React.SetStateAction<T[]>>,
) {
  return (
    idValue: T[keyof T],
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setList((prev) =>
      prev.map((item) =>
        item[idKey] === idValue ? { ...item, [name]: value } : item,
      ),
    );
  };
}
