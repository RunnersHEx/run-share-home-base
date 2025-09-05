import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { PointsManagementService } from '@/services/pointsManagementService';
import { toast } from 'sonner';
import { Shield, Coins, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const VerificationPointsDebugger = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const checkVerificationStatus = async () => {
    if (!user?.id || !profile?.id) {
      toast.error('Usuario no encontrado');
      return;
    }

    setCheckingStatus(true);
    try {
      const uploadedDocs = profile?.verification_documents || [];
      const hasBothDocs = uploadedDocs.some(doc => doc.includes('id_document')) && 
                         uploadedDocs.some(doc => doc.includes('selfie_with_id'));

      const history = await PointsManagementService.getUserPointsHistory(profile.id, 50);
      setPointsHistory(history);

      const hasVerificationPoints = history.some(transaction => 
        transaction.description.includes('Identity verification completed')
      );

      const status = {
        userId: user.id,
        profileId: profile.id,
        verificationStatus: profile.verification_status,
        documentsUploaded: uploadedDocs.length,
        hasIdDocument: uploadedDocs.some(doc => doc.includes('id_document')),
        hasSelfieWithId: uploadedDocs.some(doc => doc.includes('selfie_with_id')),
        hasBothRequiredDocs: hasBothDocs,
        hasVerificationPoints,
        currentBalance: profile.points_balance || 0,
        verificationTransactions: history.filter(t => t.description.includes('Identity verification'))
      };

      console.log('Verification Status Debug:', status);
      
      toast.success(`Debug Info:
        • Both docs: ${hasBothDocs ? 'Yes' : 'No'}
        • Has points: ${hasVerificationPoints ? 'Yes' : 'No'}  
        • Balance: ${status.currentBalance} pts
        • Status: ${profile.verification_status}`);
        
    } catch (error) {
      console.error('Error checking verification status:', error);
      toast.error('Error al verificar estado');
    } finally {
      setCheckingStatus(false);
    }
  };

  const awardVerificationPointsManually = async () => {
    if (!profile?.id) {
      toast.error('Perfil no encontrado');
      return;
    }

    setLoading(true);
    try {
      const uploadedDocs = profile?.verification_documents || [];
      const hasBothDocs = uploadedDocs.some(doc => doc.includes('id_document')) && 
                         uploadedDocs.some(doc => doc.includes('selfie_with_id'));

      if (!hasBothDocs) {
        toast.error('El usuario no tiene ambos documentos requeridos');
        return;
      }

      const history = await PointsManagementService.getUserPointsHistory(profile.id, 50);
      const hasVerificationPoints = history.some(transaction => 
        transaction.description.includes('Identity verification completed')
      );

      if (hasVerificationPoints) {
        toast.error('El usuario ya tiene puntos de verificación');
        return;
      }

      await PointsManagementService.awardVerificationPoints(profile.id);
      toast.success('¡25 puntos de verificación otorgados exitosamente!');
      
      // Refresh to show updated data
      setTimeout(() => {
        checkVerificationStatus();
      }, 1000);
      
    } catch (error) {
      console.error('Error awarding verification points:', error);
      toast.error('Error al otorgar puntos de verificación');
    } finally {
      setLoading(false);
    }
  };

  const uploadedDocs = profile?.verification_documents || [];
  const hasBothDocs = uploadedDocs.some(doc => doc.includes('id_document')) && 
                     uploadedDocs.some(doc => doc.includes('selfie_with_id'));
  const verificationPoints = pointsHistory.filter(t => t.description.includes('Identity verification'));

  return (
    <Card className="border-2 border-dashed border-yellow-300 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-yellow-800">
          <Shield className="h-5 w-5" />
          <span>Verificación de Puntos - Debug Tool</span>
          <Badge variant="secondary">DEV</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-1">
              {hasBothDocs ? (
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 mx-auto" />
              )}
            </div>
            <div className="text-sm font-medium">Documentos</div>
            <div className="text-xs text-gray-600">{uploadedDocs.length}/2</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-1">
              {verificationPoints.length > 0 ? (
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 mx-auto" />
              )}
            </div>
            <div className="text-sm font-medium">Puntos Verificación</div>
            <div className="text-xs text-gray-600">
              {verificationPoints.length > 0 ? 'Otorgados' : 'Pendientes'}
            </div>
          </div>
          
          <div className="text-center">
            <Coins className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-medium">Balance Actual</div>
            <div className="text-xs text-gray-600">{profile?.points_balance || 0} pts</div>
          </div>
          
          <div className="text-center">
            <Badge 
              variant={profile?.verification_status === 'verified' ? 'default' : 'secondary'}
              className="mb-1"
            >
              {profile?.verification_status || 'pending'}
            </Badge>
            <div className="text-sm font-medium">Estado</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={checkVerificationStatus}
            disabled={checkingStatus}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checkingStatus ? 'animate-spin' : ''}`} />
            Verificar Estado
          </Button>
          
          <Button
            onClick={awardVerificationPointsManually}
            disabled={loading || !hasBothDocs}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Coins className="h-4 w-4 mr-2" />
            {loading ? 'Otorgando...' : 'Otorgar Puntos Manualmente'}
          </Button>
        </div>

        {/* Verification Transactions */}
        {verificationPoints.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-medium text-green-800 mb-2">Transacciones de Verificación:</h4>
            {verificationPoints.map((transaction, index) => (
              <div key={index} className="text-sm text-green-700">
                • {transaction.description} - {transaction.amount} pts 
                ({new Date(transaction.created_at).toLocaleDateString()})
              </div>
            ))}
          </div>
        )}

        {/* Debug Info */}
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
            Información de Debug
          </summary>
          <div className="mt-2 bg-gray-50 p-2 rounded text-xs font-mono">
            <div>User ID: {user?.id}</div>
            <div>Profile ID: {profile?.id}</div>
            <div>Documents: {JSON.stringify(uploadedDocs)}</div>
            <div>Has Both Docs: {hasBothDocs.toString()}</div>
            <div>Verification Status: {profile?.verification_status}</div>
            <div>Points Balance: {profile?.points_balance}</div>
            <div>Verification Transactions: {verificationPoints.length}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

export default VerificationPointsDebugger;
