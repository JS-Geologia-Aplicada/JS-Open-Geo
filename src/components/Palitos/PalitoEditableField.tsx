import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button, Form } from "react-bootstrap";
import styles from "./PalitoEditableField.module.css";

interface PalitoEditableFieldProps {
  value: string;
  fieldKey: string;
  activeField: string | null;
  unit?: string;
  multiline?: boolean;
  setActiveField: (field: string | null) => void;
  onConfirm: (newValue: string) => void;
}

const PalitoEditableField = ({
  value,
  fieldKey,
  activeField,
  unit,
  multiline,
  setActiveField,
  onConfirm,
}: PalitoEditableFieldProps) => {
  const [editValue, setEditValue] = useState<string>("");
  const isEditing = activeField === fieldKey;
  const isDisabled = activeField !== null && activeField !== fieldKey;

  const handleStartEdit = () => {
    setEditValue(value);
    setActiveField(fieldKey);
  };

  const handleConfirm = () => {
    onConfirm(editValue);
    setActiveField(null);
  };

  const handleCancel = () => {
    setActiveField(null);
  };

  if (isEditing) {
    return (
      <div className="d-flex align-items-center gap-1 me-3">
        <Form.Control
          type="text"
          as={multiline ? "textarea" : undefined}
          size="sm"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") handleCancel();
          }}
          autoFocus
        />
        <Button
          variant="link"
          style={{ color: "green" }}
          className="p-0"
          onClick={handleConfirm}
        >
          <Check size={14} />
        </Button>
        <Button
          variant="link"
          style={{ color: "red" }}
          className="p-0"
          onClick={handleCancel}
        >
          <X size={14} />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button
        className={styles.editableField}
        variant="link"
        onClick={handleStartEdit}
        disabled={isDisabled}
      >
        <span>
          {value}
          {unit}
        </span>
      </Button>
    </div>
  );
};

export default PalitoEditableField;
