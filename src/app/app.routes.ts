import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './login/login.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { FacultyLoginComponent } from './faculty-login/faculty-login.component';
import { Dashboard } from './dashboard/dashboard';
import { BooksComponent } from './dashboard/books/books.component';
import { StudentsComponent } from './dashboard/students/students.component';
import { AdminsComponent } from './dashboard/admins/admins.component';
import { ReportsComponent } from './dashboard/reports/reports.component';
import { OverviewComponent } from './dashboard/overview/overview.component';
import { BorrowingComponent } from './dashboard/borrowing/borrowing.component';
import { ReservationsComponent } from './dashboard/reservations/reservations.component';
import { FacultyComponent } from './dashboard/faculty/faculty.component';
import { SystemSettingsComponent } from './dashboard/system-settings/system-settings.component';
import { ActivityLogsComponent } from './dashboard/activity-logs/activity-logs.component';
import { ProfileComponent } from './dashboard/profile/profile.component';
import { CatalogingRouteComponent } from './dashboard/cataloging/cataloging-route.component';
import { ArchivedBooksComponent } from './dashboard/archived-books/archived-books.component';
import { StudentDashboardComponent } from './student-dashboard/student-dashboard.component';
import { StudentProfileComponent } from './student-profile/student-profile.component';
import { FacultyDashboardComponent } from './faculty-dashboard/faculty-dashboard.component';
import { FacultyProfileComponent } from './faculty-profile/faculty-profile.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './terms-of-service/terms-of-service.component';
import { SupportComponent } from './support/support.component';
import { ContactComponent } from './contact/contact.component';
import { AboutComponent } from './about/about.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { AdminGuard } from './guards/admin.guard';
import { StudentGuard } from './guards/student.guard';
import { FacultyGuard } from './guards/faculty.guard';

import { TestComponent } from './test/test.component';

export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'login', component: LoginComponent },
    { path: 'adminlogin', component: AdminLoginComponent },
    { path: 'facultylogin', component: FacultyLoginComponent },
    { path: 'forgot-password/:type', component: ForgotPasswordComponent },
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [AdminGuard],
        children: [
            { path: '', redirectTo: 'overview', pathMatch: 'full' },
            { path: 'overview', component: OverviewComponent },
            { path: 'books', component: BooksComponent },
            { path: 'students', component: StudentsComponent },
            { path: 'admins', component: AdminsComponent },
            { path: 'reports', component: ReportsComponent },
            // Additional dashboard components
            { path: 'borrowing', component: BorrowingComponent },
            { path: 'reservations', component: ReservationsComponent },
            { path: 'archived-books', component: ArchivedBooksComponent },
            { path: 'faculty', component: FacultyComponent },
            { path: 'system-settings', component: SystemSettingsComponent },
            { path: 'logs', component: ActivityLogsComponent },
            { path: 'cataloging', component: CatalogingRouteComponent },
            { path: 'profile', component: ProfileComponent }
        ]
    },
    // Standalone profile page (outside dashboard layout)
    { path: 'profile', component: ProfileComponent, canActivate: [AdminGuard] },
    { path: 'student-dashboard', component: StudentDashboardComponent, canActivate: [StudentGuard] },
    { path: 'student-profile', component: StudentProfileComponent, canActivate: [StudentGuard] },
    { path: 'faculty-dashboard', component: FacultyDashboardComponent, canActivate: [FacultyGuard] },
    { path: 'faculty-profile', component: FacultyProfileComponent, canActivate: [FacultyGuard] },
    { path: 'privacy-policy', component: PrivacyPolicyComponent },
    { path: 'terms-of-service', component: TermsOfServiceComponent },
    { path: 'support', component: SupportComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'about', component: AboutComponent },
    { path: 'test', component: TestComponent },
    // 404 Not Found - This must be the last route
    { path: '**', component: NotFoundComponent }
];
