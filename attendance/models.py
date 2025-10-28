from django.db import models

from users.models import Batch, Subject, User

# Create your models here.
class Attendance(models.Model):
    class AttendanceStatus(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"
        LEAVE = "leave", "Leave"
        HALF_DAY = "half_day", "Half Day"
        WORK_FROM_HOME = "work_from_home", "Work From Home"
        WORK_FROM_OFFICE = "work_from_office", "Work From Office"
        NOT_APPLICABLE = "NA", "Not Applicable"
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=AttendanceStatus.choices, default=AttendanceStatus.NOT_APPLICABLE)
    created_at = models.DateTimeField(auto_now_add=True)