export class NotificationDTO {
  notification_title: string;
  notification_description: string;
  notification_type: string;
  notification_id?: string;
  data: Record<string, string>;

  constructor(
    title: string,
    description: string,
    type: string,
    id?: string,
    data: Record<string, string> = {},
  ) {
    this.notification_title = title;
    this.notification_description = description;
    this.notification_type = type;
    this.notification_id = id;
    this.data = data;
  }

  toData(): { [key: string]: string } {
    const data = {
      notification_title: this.notification_title,
      notification_description: this.notification_description,
      notification_type: this.notification_type,
    };
    return {
      ...data,
      ...this.data,
      ...(this.notification_id
        ? { notification_id: this.notification_id }
        : {}),
    };
  }
}
