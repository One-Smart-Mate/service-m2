export class NotificationDTO {
  notification_title: string;
  notification_description: string;
  notification_type: string;

  constructor(title: string, description: string, type: string) {
    this.notification_title = title;
    this.notification_description = description;
    this.notification_type = type;
  }

  toData(): { [key: string]: string } {
    return {
      notification_title: this.notification_title,
      notification_description: this.notification_description,
      notification_type: this.notification_type,
    };
  }
}
