#!/bin/bash

# ==============================
# CONFIG
# ==============================
INSTANCE_ID="i-xxxxxxxxxxxxxxxx"  # Replace with your instance ID
REGION="us-east-1"

# ==============================
# INPUT VALIDATION
# ==============================
ACTION="$1"

if [ "$ACTION" != "start" ] && [ "$ACTION" != "stop" ]; then
    echo "[ERROR] Invalid command"
    echo "Usage: $0 {start|stop}"
    exit 1
fi

# ==============================
# SCOUT — GET CURRENT STATE
# ==============================
CURRENT_STATE=$(aws ec2 describe-instances \
  --region "$REGION" \
  --instance-ids "$INSTANCE_ID" \
  --query "Reservations[0].Instances[0].State.Name" \
  --output text)

if [ -z "$CURRENT_STATE" ] || [ "$CURRENT_STATE" == "None" ]; then
    echo "[ERROR] Unable to determine instance state"
    exit 1
fi

echo "[INFO] Instance ID : $INSTANCE_ID"
echo "[INFO] Current State: $CURRENT_STATE"

# ==============================
# DECISION LOGIC
# ==============================
if [ "$ACTION" == "start" ]; then

    if [ "$CURRENT_STATE" == "running" ]; then
        echo "[SKIP] Instance already running."
        exit 0
    fi

    if [ "$CURRENT_STATE" == "pending" ]; then
        echo "[SKIP] Instance is already starting."
        exit 0
    fi

    echo "[INFO] Sending START request..."
    aws ec2 start-instances \
      --region "$REGION" \
      --instance-ids "$INSTANCE_ID"

elif [ "$ACTION" == "stop" ]; then

    if [ "$CURRENT_STATE" == "stopped" ]; then
        echo "[SKIP] Instance already stopped."
        exit 0
    fi

    if [ "$CURRENT_STATE" == "stopping" ]; then
        echo "[SKIP] Instance is already stopping."
        exit 0
    fi

    echo "[INFO] Sending STOP request..."
    aws ec2 stop-instances \
      --region "$REGION" \
      --instance-ids "$INSTANCE_ID"

fi

echo "[INFO] Action '$ACTION' requested successfully."