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

export async function scheduleRecurringReminder(
  title: string,
  amount: number,
  dayOfMonth: number,
  isSubscription: boolean
) {
  // Alerta no dia do vencimento às 08h00
  await Notifications.scheduleNotificationAsync({
    content: {
      title: isSubscription ? `💳 Assinatura Hoje: ${title}` : `📅 Gasto Fixo Hoje: ${title}`,
      body: `Valor: ${formatCurrency(amount)}. Não esqueça de registrar!`,
    },
    trigger: {
      day: dayOfMonth,
      hour: 8,
      minute: 0,
      repeats: true,
    },
  });

  // Alerta 1 dia antes às 18h00
  // Nota: Se o dia for 1, o alerta do dia anterior simplificado será no dia 28/30 do mês (lógica simplificada do Expo)
  const alertDay = dayOfMonth === 1 ? 28 : dayOfMonth - 1; 
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `⏳ Vence Amanhã: ${title}`,
      body: `Prepare o saldo de ${formatCurrency(amount)} para amanhã.`,
    },
    trigger: {
      day: alertDay,
      hour: 18,
      minute: 0,
      repeats: true,
    },
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
