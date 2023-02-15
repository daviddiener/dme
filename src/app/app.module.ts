// Angular
import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

// Material Design
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { MatTableModule } from '@angular/material/table'
import { MatSelectModule } from '@angular/material/select'
import { MatSnackBarModule } from '@angular/material/snack-bar'

// Components
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { DesignerComponent } from './designer/designer.component'
import { ModelExtractorComponent } from './model-extractor/model-extractor.component'
import { HomeComponent } from './home/home.component'

@NgModule({
    declarations: [AppComponent, DesignerComponent, ModelExtractorComponent, HomeComponent],
    imports: [
        BrowserModule,
        CommonModule,
        AppRoutingModule,
        NgbModule,
        BrowserAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule,
        MatTableModule,
        MatSelectModule,
        MatSnackBarModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
