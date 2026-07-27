import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Trash2, X } from "lucide-react";
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
  onDelete?: () => void;
  listInfo?: { position: number; total: number };
  onMove?: (movement: number, currentEditValue: string) => void;
}

const PalitoEditableField = ({
  value,
  fieldKey,
  activeField,
  unit,
  multiline,
  setActiveField,
  onConfirm,
  onDelete,
  listInfo,
  onMove,
}: PalitoEditableFieldProps) => {
  const [editValue, setEditValue] = useState<string>("");
  const isEditing = activeField === fieldKey;
  const isDisabled = activeField !== null && activeField !== fieldKey;
  const [isNotFirst, isNotLast] = !listInfo
    ? [null, null]
    : [listInfo?.position !== 1, listInfo?.position !== listInfo?.total];

  useEffect(() => {
    if (isEditing) {
      setEditValue(value);
    }
  }, [isEditing]);

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

  const handleDelete = () => {
    if (!onDelete) return;
    onDelete();
    setActiveField(null);
  };

  if (isEditing) {
    return (
      <div className="d-flex flex-column align-items-center">
        {isNotFirst && (
          <div>
            <button
              className={styles.moveButton}
              onClick={() => {
                if (!onMove || !listInfo) return;
                onMove(-1, editValue);
              }}
            >
              <ChevronUp />
            </button>
          </div>
        )}
        <div className="d-flex align-items-center gap-1 me-3 w-100">
          <Form.Control
            type="text"
            as={multiline ? "textarea" : undefined}
            size="sm"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onFocus={(e) => e.target.select()}
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
          {onDelete && (
            <Button
              variant="link"
              style={{ color: "black" }}
              className="p-0"
              onClick={handleDelete}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
        {isNotLast && (
          <div>
            <button
              className={styles.moveButton}
              onClick={() => {
                if (!onMove || !listInfo) return;
                onMove(1, editValue);
              }}
            >
              <ChevronDown />
            </button>
          </div>
        )}
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
