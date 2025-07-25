import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./dice-roll/dice-roll').then(m => m.DiceRoll)
    },
    {
        path: '**',
        redirectTo: '',
    }
];
