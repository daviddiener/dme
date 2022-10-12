import { NgModule } from '@angular/core';
import { DesignerComponent } from './designer/designer.component';
import { RouterModule, Routes } from '@angular/router';
import { ModelExtractorComponent } from './model-extractor/model-extractor.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: 'designer', component: DesignerComponent },
  { path: 'extractor', component: ModelExtractorComponent },
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
