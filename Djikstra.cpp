#include <stdio.h>
#include <limits.h>

#define V 9 //NUMBER OF VERTICES

// A utility function to find the vertex with minimum distance value, from
// the set of vertices not yet included in shortest path tree
int minDistance(int dist[], bool sptSet[]) //SPTSET IS A BOOLEAN ARRAY WHICH STORES TRUE IF THE VERTEX HAS BEEN INCLUDED AND FALSE IF NOT
{
int min = INT_MAX, min_index;
for (int v = 0; v < V; v++)
	if (sptSet[v] == false && dist[v] <= min)
    {
        min = dist[v];
		min_index = v;
    }
return min_index;
}

int print(int dist[], int n)
{
printf("Vertex Distance from Source\n");
for (int i = 0; i < V; i++)
	printf("%d tt %d\n", i, dist[i]);
}

// Function that implements Dijkstra's single source shortest path algorithm
// for a graph represented using adjacency matrix representation
void dijkstra(int graph[V][V], int src)
{
	int dist[V];	 // The output array. dist[i] will hold the shortest
					// distance from src to i

	bool sptSet[V]; // sptSet[i] will be true if vertex i is included in shortest
					// path tree or shortest distance from src to i is finalized

	// Initialize all distances as INFINITE and stpSet[] as false
	for (int i = 0; i < V; i++)
		dist[i] = INT_MAX, sptSet[i] = false;

	// Distance of source vertex from itself is always 0
	dist[src] = 0;

	for (int count = 0; count < V-1; count++)
	{
	int u = minDistance(dist, sptSet);
	sptSet[u] = true;
	for (int v = 0; v < V; v++)
		if (!sptSet[v] && graph[u][v] && dist[u] != INT_MAX && dist[u]+graph[u][v] < dist[v])
			dist[v] = dist[u] + graph[u][v];
	}
	print(dist, V);
}
int main()
{
int graph[V][V] = {{0, 4, 0, 0, 0, 0, 0, 8, 0},/*THE ARRAY CONTAINS DISTANCES BETWEEN TWO VERTICES */
					{4, 0, 8, 0, 0, 0, 0, 11, 0},
					{0, 8, 0, 7, 0, 4, 0, 0, 2},
					{0, 0, 7, 0, 9, 14, 0, 0, 0},
					{0, 0, 0, 9, 0, 10, 0, 0, 0},
					{0, 0, 4, 14, 10, 0, 2, 0, 0},
					{0, 0, 0, 0, 0, 2, 0, 1, 6},
					{8, 11, 0, 0, 0, 0, 1, 0, 7},
					{0, 0, 2, 0, 0, 0, 6, 7, 0}
					};

	dijkstra(graph, 0);

	return 0;
}

