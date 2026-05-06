import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { formatDate, formatCurrency } from "./format";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === "granted";
}

export async function scheduleLoanReminder(
  id: string,
  contactName: string,
  description: string,
  amount: number,
  dueDate: string
) {
  const trigger = new Date(dueDate);
  trigger.setHours(9, 0, 0, 0); // Notificar às 9h da manhã do dia

  // Se a data já passou, não agenda
  if (trigger.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Vencimento Hoje: ${contactName}`,
      body: `${description} - ${formatCurrency(amount)}`,
      data: { loanId: id },
    },
    trigger,
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
