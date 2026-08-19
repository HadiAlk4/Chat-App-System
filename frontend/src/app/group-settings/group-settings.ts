import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-group-settings',
  imports: [FormsModule, RouterLink],
  templateUrl: './group-settings.html',
  styleUrl: './group-settings.css',
})
export class GroupSettings 
{

  userRole: string = 'group-admin';
  username: string = 'hadialk04';

  groupName: string = 'Sci-Fi Larpers';

  groupDescription: string = 'when ts not just intersteller and chess videos';

  groupMinAge: number = 0;

  groupThemeColor: string = 'blue';
}
