#!/bin/bash

# ===== CONFIG =====
INSTANCE_ID="i-xxxxxxxxxxxxxxxx"  # Replace with your instance ID

# ===== STATE =====
STATE=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query "Reservations[].Instances[].State.Name" \
  --output text)

# ===== HEALTH =====
SYSTEM_STATUS=$(aws ec2 describe-instance-status \
  --instance-ids $INSTANCE_ID \
  --query "InstanceStatuses[].SystemStatus.Status" \
  --output text)

INSTANCE_STATUS=$(aws ec2 describe-instance-status \
  --instance-ids $INSTANCE_ID \
  --query "InstanceStatuses[].InstanceStatus.Status" \
  --output text)

# Handle stopped instances
if [ -z "$SYSTEM_STATUS" ]; then
    SYSTEM_STATUS="N/A"
    INSTANCE_STATUS="N/A"
fi

# ===== ANALYSIS =====
HEALTH_RESULT="[ALERT]"
if [ "$SYSTEM_STATUS" == "ok" ] && [ "$INSTANCE_STATUS" == "ok" ]; then
    HEALTH_RESULT="[OK]"
fi

# ===== OUTPUT =====
echo "----------------------------------"
echo "Instance ID: $INSTANCE_ID"
echo "State:       $STATE"
echo "System:      $SYSTEM_STATUS"
echo "Instance:    $INSTANCE_STATUS"
echo "Health:      $HEALTH_RESULT"
echo "----------------------------------"
