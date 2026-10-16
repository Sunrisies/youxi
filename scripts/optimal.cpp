// Offline exact solver. Each legal maximal transfer costs one move.
#include <algorithm>
#include <array>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <unordered_map>
#include <vector>
struct Tube { uint32_t bits=0; int len=0; };
using Board=std::array<Tube,10>;
using Key=std::array<uint32_t,10>;
struct Hash {size_t operator()(const Key& k)const {size_t h=1469598103934665603ULL;for(auto v:k){h^=v;h*=1099511628211ULL;}return h;}};
int count,colors;
uint64_t nodes;
std::unordered_map<Key,int,Hash> seen;
std::vector<std::pair<int,int>> trail;
int top(Tube t){return (t.bits>>((t.len-1)*4))&15;}
int run(Tube t){if(!t.len)return 0;int c=top(t),n=0;for(int i=t.len-1;i>=0;i--){if(((t.bits>>(i*4))&15)!=uint32_t(c))break;n++;}return n;}
bool complete(Tube t){return t.len==4&&run(t)==4;}
int bound(const Board& b){int groups=0;for(int j=0;j<count;j++){int prev=-1;for(int i=0;i<b[j].len;i++){int c=(b[j].bits>>(4*i))&15;if(c!=prev)groups++;prev=c;}}return groups-colors;}
Key canonical(const Board& b){Key k{};for(int i=0;i<count;i++)k[i]=b[i].bits|(uint32_t(b[i].len)<<20);std::sort(k.begin(),k.end());return k;}
struct Move {Board board;int from,to,rank;};
bool search(const Board& b,int left){
 nodes++;
 int lower=bound(b);if(lower==0){bool win=true;for(int i=0;i<count;i++)if(b[i].len&&!complete(b[i]))win=false;if(win)return true;}
 if(left<lower||left==0)return false;
 Key key=canonical(b);auto found=seen.find(key);if(found!=seen.end()&&found->second>=left)return false;seen[key]=left;
 std::vector<Move> moves;
 for(int from=0;from<count;from++){
  const Tube a=b[from];if(!a.len||complete(a))continue;
  bool duplicate=false;for(int i=0;i<from;i++)if(b[i].bits==a.bits&&b[i].len==a.len)duplicate=true;if(duplicate)continue;
  for(int to=0;to<count;to++){
   const Tube target=b[to];if(from==to||target.len==4||(target.len&&top(target)!=top(a)))continue;
   if(!target.len&&run(a)==a.len)continue; // Only relabels an empty box.
   duplicate=false;for(int i=0;i<to;i++)if(i!=from&&b[i].bits==target.bits&&b[i].len==target.len)duplicate=true;if(duplicate)continue;
   int n=std::min(run(a),4-target.len);Board next=b;int color=top(a);
   next[from].len-=n;next[from].bits&=(1u<<(next[from].len*4))-1;
   for(int i=0;i<n;i++)next[to].bits|=uint32_t(color)<<((target.len+i)*4);
   next[to].len+=n;
   int rank=bound(next)*100-(complete(next[to])?15:0)-(next[from].len==0?5:0);
   moves.push_back({next,from,to,rank});
  }
 }
 std::stable_sort(moves.begin(),moves.end(),[](const Move&a,const Move&b){return a.rank<b.rank;});
 for(const auto&m:moves){trail.push_back({m.from,m.to});if(search(m.board,left-1))return true;trail.pop_back();}
 return false;
}
int main(int argc,char**argv){
 if(argc!=3)return 2;std::ifstream input(argv[1]);std::ofstream output(argv[2]);int total;input>>total;
 for(int level=1;level<=total;level++){
  input>>colors>>count;Board board{};
  for(int j=0;j<count;j++){input>>board[j].len;for(int i=0;i<board[j].len;i++){int color;input>>color;board[j].bits|=uint32_t(color+1)<<(4*i);}}
  nodes=0;int lower=bound(board);
  for(int depth=lower;;depth++){
   seen.clear();trail.clear();if(search(board,depth))break;
  }
  output<<level<<' '<<trail.size();for(auto m:trail)output<<' '<<m.first<<' '<<m.second;output<<'\n';output.flush();
  std::cout<<"Level "<<level<<": optimal "<<trail.size()<<" moves, "<<nodes<<" nodes"<<std::endl;
 }
}
