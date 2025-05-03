import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes?: string) => void;
}

const RejectDialog: React.FC<RejectDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState<string>('');
  const [showOtherReason, setShowOtherReason] = useState(false);
  const [otherReason, setOtherReason] = useState('');

  useEffect(() => {
    // Reset the form when the dialog is opened or closed
    if (!isOpen) {
      setReason('');
      setOtherReason('');
      setShowOtherReason(false);
    }
  }, [isOpen]);

  const handleReasonChange = (value: string) => {
    setReason(value);
    setShowOtherReason(value === 'other');
  };

  const handleConfirm = () => {
    if (!reason) return;
    
    if (reason === 'other' && otherReason) {
      onConfirm(reason, otherReason);
    } else {
      onConfirm(reason);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reject Candidate</DialogTitle>
          <DialogDescription>
            Please specify a reason for rejecting this candidate:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Select value={reason} onValueChange={handleReasonChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skills_mismatch">Skills mismatch</SelectItem>
                <SelectItem value="experience_low">Insufficient experience</SelectItem>
                <SelectItem value="culture_fit">Culture fit concerns</SelectItem>
                <SelectItem value="salary_expectations">Salary expectations too high</SelectItem>
                <SelectItem value="communication_skills">Communication skills</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {showOtherReason && (
            <div className="space-y-2">
              <Label htmlFor="other-reason">Please specify:</Label>
              <Textarea
                id="other-reason"
                placeholder="Enter reason for rejection..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!reason || (showOtherReason && !otherReason)}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectDialog;
