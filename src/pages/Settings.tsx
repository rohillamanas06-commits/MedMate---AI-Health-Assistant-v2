import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MessageSquare, FileText, Loader2, Trash2, AlertTriangle, ShieldAlert, MailCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const { checkAuth, user } = useAuth();
  const [deletingChat, setDeletingChat] = useState(false);
  const [deletingDiagnosis, setDeletingDiagnosis] = useState(false);
  const [sendingDeletionCode, setSendingDeletionCode] = useState(false);
  const [accountCode, setAccountCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);

  const handleDeleteChatHistory = async () => {
    setDeletingChat(true);
    try {
      await api.deleteChatHistory();
      toast.success('Chat history deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete chat history');
    } finally {
      setDeletingChat(false);
    }
  };

  const handleSendAccountDeletionCode = async () => {
    setSendingDeletionCode(true);
    try {
      await api.requestAccountDeletionCode();
      setCodeSent(true);
      toast.success('Verification code sent to your email');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setSendingDeletionCode(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (accountCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setAccountDeleting(true);
    try {
      await api.confirmAccountDeletion(accountCode);
      toast.success('Your account has been deleted');
      setAccountCode('');
      setCodeSent(false);
      await checkAuth();
      navigate('/auth');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setAccountDeleting(false);
    }
  };

  const handleDeleteDiagnosisHistory = async () => {
    setDeletingDiagnosis(true);
    try {
      await api.deleteDiagnosisHistory();
      toast.success('Diagnosis history deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete diagnosis history');
    } finally {
      setDeletingDiagnosis(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-4 px-3 sm:py-12">
      <div className="container max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-10 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your account and privacy settings
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Data Management */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Data Management
            </h2>
            <Card className="overflow-hidden">
              <div className="divide-y divide-border">
                {/* Chat History */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-destructive/10 shrink-0">
                      <MessageSquare className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base">Chat History</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        Delete all AI conversation history
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingChat}
                        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                      >
                        {deletingChat ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Delete
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Delete Chat History?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your chat history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteChatHistory}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Diagnosis History */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-destructive/10 shrink-0">
                      <FileText className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base">Diagnosis History</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        Delete all symptom analyses
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingDiagnosis}
                        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                      >
                        {deletingDiagnosis ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Delete
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Delete Diagnosis History?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your diagnosis history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteDiagnosisHistory}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          </section>

          {/* Account Deletion */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Danger Zone
            </h2>
            <Card className="border-destructive/20">
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-destructive/10 shrink-0">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">Delete Account</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Permanently delete your account and all data. A verification code will be sent to {user?.email}.
                    </p>
                  </div>
                </div>

                {!codeSent ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendAccountDeletionCode}
                    disabled={sendingDeletionCode}
                    className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                  >
                    {sendingDeletionCode ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MailCheck className="h-4 w-4 mr-2" />
                    )}
                    Send Verification Code
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code sent to your email:
                    </p>
                    <InputOTP
                      maxLength={6}
                      value={accountCode}
                      onChange={(value) => setAccountCode(value)}
                      disabled={accountDeleting}
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((slot) => (
                          <InputOTPSlot key={slot} index={slot} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={accountDeleting}
                      className="w-full sm:w-auto"
                    >
                      {accountDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Confirm & Delete Account
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* Warning */}
          <Card className="bg-amber-500/5 border-amber-500/20">
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-600 text-sm">Important Notice</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Deleting data is permanent and cannot be undone. Please make sure you want to proceed before confirming.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

