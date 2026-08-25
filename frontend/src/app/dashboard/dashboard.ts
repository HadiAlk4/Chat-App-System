import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard 
{

  userRole: string = 'user';
  username: string = 'hadialk04';

  availableGroups = 
  [
    {
      name: 'Sci-Fi Writers',
      minAge: '16+',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.'
    },
    {
      name: 'Digital Artists Collab',
      minAge: '13+',
      description: 'Share your digital drawings, ask for feedback, and collaborate on big canvas projects together.'
    },
    {
      name: 'Sci-Fi Writers',
      minAge: '16+',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.'
    },
    {
      name: 'Digital Artists Collab',
      minAge: '13+',
      description: 'Share your digital drawings, ask for feedback, and collaborate on big canvas projects together.'
    },{
      name: 'Sci-Fi Writers',
      minAge: '16+',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.'
    },
    {
      name: 'Digital Artists Collab',
      minAge: '13+',
      description: 'Share your digital drawings, ask for feedback, and collaborate on big canvas projects together.'
    },{
      name: 'Sci-Fi Writers',
      minAge: '16+',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.'
    },
    {
      name: 'Digital Artists Collab',
      minAge: '13+',
      description: 'Share your digital drawings, ask for feedback, and collaborate on big canvas projects together.'
    },
  ];

  displayedGroups: any[] = [];
  searchQuery: string = '';

  ngOnInit() 
  {
    this.displayedGroups = [...this.availableGroups];
  }

  applySearch() 
  {
    if (!this.searchQuery.trim()) 
    {
      this.displayedGroups = [...this.availableGroups];
      return;
    }
    const lowerCaseQuery = this.searchQuery.toLowerCase();
    this.displayedGroups = this.availableGroups.filter(group => 
      group.name.toLowerCase().includes(lowerCaseQuery)
    );
  }
}
