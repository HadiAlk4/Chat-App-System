import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login', // html tag selector
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {}
