export interface OrderNumberSource {
  id?: string;
  orderNumber?: string;
  customer?: { firstName?: string; lastName?: string };
  createdAt?: { toDate(): Date };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function initial(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .charAt(0)
    .toUpperCase() || 'X';
}

export function createOrderNumber(firstName: string, lastName: string, date = new Date()) {
  const orderDate = `${String(date.getFullYear()).slice(-2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const initials = `${initial(firstName)}${initial(lastName)}`;
  const orderTime = `${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `MK-${orderDate}-${initials}-${orderTime}`;
}

export function displayOrderNumber(order: OrderNumberSource) {
  if (order.orderNumber) return order.orderNumber;
  const createdAt = order.createdAt?.toDate();
  if (createdAt) {
    return createOrderNumber(order.customer?.firstName ?? '', order.customer?.lastName ?? '', createdAt);
  }
  return `MK-${(order.id ?? 'COMMANDE').slice(0, 8).toUpperCase()}`;
}
