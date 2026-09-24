export class NotificationDTO {
  notification_title: string;
  notification_description: string;
  notification_type: string;
  notification_id?: string;

  constructor(
    title: string,
    description: string,
    type: string,
    id?: string,
  ) {
    this.notification_title = title;
    this.notification_description = description;
    this.notification_type = type;
    this.notification_id = id;
  }

  toData(): { [key: string]: string } {
    const data = {
      notification_title: this.notification_title,
      notification_description: this.notification_description,
      notification_type: this.notification_type,
    };
    return this.notification_id
      ? { ...data, notification_id: this.notification_id }
      : data;
  }
}
