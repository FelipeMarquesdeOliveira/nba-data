import type { Player } from '@/types';

export const lakersPlayers: Player[] = [
  { id: '2544', fullName: 'LeBron James', firstName: 'LeBron', lastName: 'James', jerseyNumber: '23', teamId: '1610612747', position: 'F' },
  { id: '1629029', fullName: 'Austin Reaves', firstName: 'Austin', lastName: 'Reaves', jerseyNumber: '15', teamId: '1610612747', position: 'G' },
  { id: '203999', fullName: 'Anthony Davis', firstName: 'Anthony', lastName: 'Davis', jerseyNumber: '3', teamId: '1610612747', position: 'F' },
  { id: '1627813', fullName: "D'Angelo Russell", firstName: "D'Angelo", lastName: 'Russell', jerseyNumber: '1', teamId: '1610612747', position: 'G' },
  { id: '203496', fullName: 'Rui Hachimura', firstName: 'Rui', lastName: 'Hachimura', jerseyNumber: '28', teamId: '1610612747', position: 'F' },
  { id: '1626150', fullName: 'Gabe Vincent', firstName: 'Gabe', lastName: 'Vincent', jerseyNumber: '7', teamId: '1610612747', position: 'G' },
  { id: '203112', fullName: 'Taurean Prince', firstName: 'Taurean', lastName: 'Prince', jerseyNumber: '12', teamId: '1610612747', position: 'F' },
  { id: '2738', fullName: 'Jarred Vanderbilt', firstName: 'Jarred', lastName: 'Vanderbilt', jerseyNumber: '8', teamId: '1610612747', position: 'F' },
  { id: '1628968', fullName: 'Max Christie', firstName: 'Max', lastName: 'Christie', jerseyNumber: '10', teamId: '1610612747', position: 'G' },
  { id: '204030', fullName: 'Colin Castleton', firstName: 'Colin', lastName: 'Castleton', jerseyNumber: '31', teamId: '1610612747', position: 'C' },
];

export const celticsPlayers: Player[] = [
  { id: '1628369', fullName: 'Jayson Tatum', firstName: 'Jayson', lastName: 'Tatum', jerseyNumber: '0', teamId: '1610612738', position: 'F' },
  { id: '1629573', fullName: 'Jaylen Brown', firstName: 'Jaylen', lastName: 'Brown', jerseyNumber: '7', teamId: '1610612738', position: 'G' },
  { id: '1627741', fullName: 'Kristaps Porzingis', firstName: 'Kristaps', lastName: 'Porzingis', jerseyNumber: '8', teamId: '1610612738', position: 'C' },
  { id: '1627854', fullName: 'Derrick White', firstName: 'Derrick', lastName: 'White', jerseyNumber: '9', teamId: '1610612738', position: 'G' },
  { id: '203481', fullName: 'Jrue Holiday', firstName: 'Jrue', lastName: 'Holiday', jerseyNumber: '4', teamId: '1610612738', position: 'G' },
  { id: '1628401', fullName: 'Al Horford', firstName: 'Al', lastName: 'Horford', jerseyNumber: '42', teamId: '1610612738', position: 'C' },
  { id: '1628436', fullName: 'Robert Williams III', firstName: 'Robert', lastName: 'Williams', jerseyNumber: '44', teamId: '1610612738', position: 'C' },
  { id: '204025', fullName: 'Peyton Watson', firstName: 'Peyton', lastName: 'Watson', jerseyNumber: '54', teamId: '1610612738', position: 'G' },
  { id: '1628439', fullName: 'Sam Hauser', firstName: 'Sam', lastName: 'Hauser', jerseyNumber: '30', teamId: '1610612738', position: 'F' },
  { id: '1629719', fullName: 'Dalano Banton', firstName: 'Dalano', lastName: 'Banton', jerseyNumber: '45', teamId: '1610612738', position: 'G' },
];

export const allPlayers = [...lakersPlayers, ...celticsPlayers];