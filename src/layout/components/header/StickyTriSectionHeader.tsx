import { PropsWithChildren } from 'react';
import { IoMdHome } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import IconButton from '../../../components/IconButton/IconButton';

// The type of header icons will be declared here.
type HeaderIcons = 'home';

function StickyTriSectionHeader(props: PropsWithChildren) {
  const { children } = props;

  return (
    <header className="sticky top-0 min-h-20 border-b-[1px] border-neutral-900 px-6">
      <div className="relative flex h-full items-center justify-between">
        {children}
      </div>
    </header>
  );
}

StickyTriSectionHeader.Left = function Left(props: PropsWithChildren) {
  const { children } = props;
  return <div className="flex-1 items-start text-start">{children}</div>;
};

StickyTriSectionHeader.Center = function Center(props: PropsWithChildren) {
  const { children } = props;
  return <div className="flex-1 items-center text-center">{children}</div>;
};

StickyTriSectionHeader.Right = function Right(props: PropsWithChildren) {
  const { children: buttons } = props;
  const navigate = useNavigate();
  const defaultIcons: HeaderIcons[] = ['home']; // Icons that will be displayed on all pages are added here

  return (
    <div className="flex flex-1 items-stretch justify-end gap-2 text-right">
      {/* Buttons given as an argument */}
      {buttons}

      {/* Normal buttons */}
      {defaultIcons.map((iconName, index) => {
        switch (iconName) {
          case 'home':
            return (
              <div key={`${iconName}-${index}`} title="홈으로 이동">
                <IconButton
                  icon={<IoMdHome size={24} />}
                  onClick={() => {
                    navigate('/');
                  }}
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

export default StickyTriSectionHeader;
