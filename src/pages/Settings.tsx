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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-3 px-3 sm:py-8">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-8 text-center animate-slide-up">
          <h1 className="text-xl sm:text-4xl font-bold mb-1 sm:mb-2 gradient-text">Settings</h1>
          <p className="text-muted-foreground text-xs sm:text-lg">
            Manage your account and privacy settings
          </p>
        </div>

        <div className="grid gap-3 sm:gap-6">
          {/* Data Management Section */}
          <Card className="p-4 sm:p-8 glass animate-fade-in">
            <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Data Management</h2>
            <p className="text-muted-foreground text-xs sm:text-base mb-4 sm:mb-6">
              Permanently delete your chat and diagnosis history from our database.
            </p>

            <div className="space-y-3 sm:space-y-4">
              {/* Delete Chat History */}
              <Card className="p-3 sm:p-4 border-2 border-destructive/20 bg-destructive/5">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-destructive/10 flex-shrink-0">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base">Chat History</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Permanently delete all your AI chat conversation history. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingChat}
                        className="w-full sm:w-auto"
                      >
                        {deletingChat ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                          </div>
                          <AlertDialogTitle>Delete Chat History?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete all your chat history? 
                          This action cannot be undone and all your previous conversations will be lost.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteChatHistory}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>

              {/* Delete Diagnosis History */}
              <Card className="p-3 sm:p-4 border-2 border-destructive/20 bg-destructive/5">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-destructive/10 flex-shrink-0">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base">Diagnosis History</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Permanently delete all your symptom diagnosis and image analysis history. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingDiagnosis}
                        className="w-full sm:w-auto"
                      >
                        {deletingDiagnosis ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                          </div>
                          <AlertDialogTitle>Delete Diagnosis History?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete all your diagnosis history? 
                          This action cannot be undone and all your previous symptom analyses will be lost.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteDiagnosisHistory}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            </div>
          </Card>

          {/* Warning Card */}
          <Card className="p-3 sm:p-6 bg-yellow-500/10 border-yellow-500/20">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-yellow-600 mb-1 text-sm sm:text-base">Important Notice</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Deleting your history is permanent and irreversible. Once deleted, you will not be able to recover any of your data. 
                  Make sure you really want to delete this information before proceeding.
                </p>
              </div>
            </div>
          </Card>

          {/* Account Deletion */}
          <Card className="p-4 sm:p-8 border border-destructive/20 bg-destructive/5 animate-fade-in">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-destructive/10 flex-shrink-0">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold">Delete Account</h2>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Permanently delete your MedMate account and all associated data. A verification code will be sent to your registered email {user?.email ? `(${user.email})` : ''}.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendAccountDeletionCode}
                  disabled={sendingDeletionCode}
                  className="w-full sm:w-auto border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  {sendingDeletionCode ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MailCheck className="h-4 w-4 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </div>

              {codeSent && (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Enter the 6-digit code sent to your email to confirm account deletion.
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
                    className="w-full sm:w-auto"
                    size="sm"
                    onClick={handleDeleteAccount}
                    disabled={accountDeleting}
                  >
                    {accountDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting Account...
                      </>
                    ) : (
                      'Confirm & Delete Account'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

