import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
  Schedule as ScheduledIcon,
  Restaurant as PreparingIcon,
  LocalDining as ReadyIcon,
  DoneAll as CompletedIcon,
  Cancel as CancelledIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledStep = styled(Step)(({ theme, active, completed }) => ({
  '& .MuiStepLabel-root .MuiStepLabel-label': {
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    fontWeight: active ? 'bold' : 'normal',
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return theme.palette.warning.main;
      case 'confirmed': return theme.palette.info.main;
      case 'preparing': return theme.palette.primary.main;
      case 'ready': return theme.palette.success.main;
      case 'served': return theme.palette.success.dark;
      case 'completed': return theme.palette.grey[600];
      case 'cancelled': return theme.palette.error.main;
      default: return theme.palette.grey.main;
    }
  };

  return {
    backgroundColor: getStatusColor(status),
    color: theme.palette.getContrastText(getStatusColor(status)),
    fontWeight: 'bold',
  };
});

const OrderStatusTracker = ({
  currentStatus,
  onStatusChange,
  orderType = 'dine-in',
  compact = false,
  showProgress = true,
  editable = false,
  statusHistory = []
}) => {
  const theme = useTheme();

  // Define status flow based on order type
  const getStatusFlow = () => {
    const baseFlow = [
      { key: 'pending', label: 'Pending', icon: <PendingIcon />, description: 'Order received' },
      { key: 'confirmed', label: 'Confirmed', icon: <ScheduledIcon />, description: 'Order confirmed' },
      { key: 'preparing', label: 'Preparing', icon: <PreparingIcon />, description: 'Kitchen preparing' },
      { key: 'ready', label: 'Ready', icon: <ReadyIcon />, description: 'Order ready' },
    ];

    if (orderType === 'dine-in') {
      return [
        ...baseFlow,
        { key: 'served', label: 'Served', icon: <LocalDining />, description: 'Order served to customer' },
        { key: 'completed', label: 'Completed', icon: <CompletedIcon />, description: 'Order completed' }
      ];
    } else {
      return [
        ...baseFlow,
        { key: 'completed', label: 'Completed', icon: <CompletedIcon />, description: 'Order completed' }
      ];
    }
  };

  const statusFlow = getStatusFlow();

  // Find current step index
  const getCurrentStepIndex = () => {
    return statusFlow.findIndex(step => step.key === currentStatus);
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / statusFlow.length) * 100;
  };

  // Check if step is completed
  const isStepCompleted = (stepKey) => {
    const currentIndex = getCurrentStepIndex();
    const stepIndex = statusFlow.findIndex(step => step.key === stepKey);
    return stepIndex < currentIndex || stepKey === currentStatus;
  };

  // Check if step is active
  const isStepActive = (stepKey) => {
    return stepKey === currentStatus;
  };

  // Get step icon
  const getStepIcon = (step) => {
    if (isStepCompleted(step.key)) {
      return <CheckCircleIcon color="success" />;
    }
    return step.icon;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'preparing': return 'primary';
      case 'ready': return 'success';
      case 'served': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Get estimated time for next status
  const getEstimatedTime = (nextStatus) => {
    // This would typically come from the backend or configuration
    const estimates = {
      'confirmed': '5-10 min',
      'preparing': '15-25 min',
      'ready': '25-35 min',
      'served': '30-40 min',
      'completed': '30-40 min'
    };
    return estimates[nextStatus] || null;
  };

  const handleStatusClick = (status) => {
    if (editable && onStatusChange) {
      onStatusChange(status);
    }
  };

  const currentStepIndex = getCurrentStepIndex();
  const progressPercentage = getProgressPercentage();

  if (compact) {
    return (
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <StatusChip
            status={currentStatus}
            label={currentStatus?.replace('_', ' ').toUpperCase()}
            size="small"
          />
          {showProgress && (
            <Typography variant="caption" color="text.secondary">
              {Math.round(progressPercentage)}% Complete
            </Typography>
          )}
        </Box>

        {showProgress && (
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
              }
            }}
          />
        )}

        <Box display="flex" justifyContent="space-between" mt={1}>
          {statusFlow.map((step, index) => (
            <Box key={step.key} textAlign="center" flex={1}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 0.5,
                  backgroundColor: isStepCompleted(step.key)
                    ? theme.palette.success.main
                    : theme.palette.grey[300],
                  color: isStepCompleted(step.key)
                    ? theme.palette.success.contrastText
                    : theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  cursor: editable ? 'pointer' : 'default',
                }}
                onClick={() => editable && handleStatusClick(step.key)}
              >
                {index + 1}
              </Box>
              <Typography variant="caption" display="block">
                {step.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Current Status Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <StatusChip
            status={currentStatus}
            label={currentStatus?.replace('_', ' ').toUpperCase()}
          />
          <Typography variant="body2" color="text.secondary">
            Step {currentStepIndex + 1} of {statusFlow.length}
          </Typography>
        </Box>

        {editable && onStatusChange && (
          <Tooltip title="Change Status">
            <IconButton size="small" onClick={() => handleStatusClick(currentStatus)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Progress Bar */}
      {showProgress && (
        <Box mb={2}>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" align="center" display="block" mt={0.5}>
            {Math.round(progressPercentage)}% Complete
          </Typography>
        </Box>
      )}

      {/* Status Stepper */}
      <Stepper
        activeStep={currentStepIndex}
        orientation="vertical"
        nonLinear={editable}
      >
        {statusFlow.map((step, index) => {
          const isCompleted = isStepCompleted(step.key);
          const isActive = isStepActive(step.key);
          const isNext = index === currentStepIndex + 1;
          const estimatedTime = isNext ? getEstimatedTime(step.key) : null;

          return (
            <StyledStep key={step.key} active={isActive} completed={isCompleted}>
              <StepLabel
                icon={getStepIcon(step)}
                onClick={() => editable && handleStatusClick(step.key)}
                sx={{ cursor: editable ? 'pointer' : 'default' }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight={isActive ? 'bold' : 'normal'}>
                    {step.label}
                  </Typography>
                  {estimatedTime && (
                    <Chip
                      label={`Est. ${estimatedTime}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>

                {/* Status History */}
                {statusHistory.length > 0 && (
                  <Box mt={1}>
                    {statusHistory
                      .filter(history => history.status === step.key)
                      .map((history, historyIndex) => (
                        <Box key={historyIndex} display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(history.timestamp).toLocaleString()}
                          </Typography>
                          {history.user_name && (
                            <Typography variant="caption" color="text.secondary">
                              by {history.user_name}
                            </Typography>
                          )}
                        </Box>
                      ))}
                  </Box>
                )}

                {/* Action for current step */}
                {isActive && editable && onStatusChange && index < statusFlow.length - 1 && (
                  <Box mt={1}>
                    <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>
                      Click to advance to next status →
                    </Typography>
                  </Box>
                )}
              </StepContent>
            </StyledStep>
          );
        })}
      </Stepper>

      {/* Cancelled Status */}
      {currentStatus === 'cancelled' && (
        <Box mt={2} p={2} bgcolor="error.light" borderRadius={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <CancelledIcon color="error" />
            <Typography variant="subtitle2" color="error.contrastText">
              Order Cancelled
            </Typography>
          </Box>
          {statusHistory.length > 0 && (
            <Typography variant="body2" color="error.contrastText" mt={1}>
              {statusHistory
                .filter(history => history.status === 'cancelled')
                .map(history => history.notes)
                .join(', ')}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default OrderStatusTracker;